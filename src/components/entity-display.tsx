"use client";

import { Entity, TimelineEvent } from "@/types/article";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

interface EntityDisplayProps {
  events?: TimelineEvent[];
}

interface EntityContext {
  id: string;
  entity: Entity;
  frequency: number;
  mentions: {
    text: string;
    date: string;
    topic: string;
    sentiment: {
      polarity: string;
      intensity: number;
    };
  }[];
}

const ENTITY_COLORS: { [key: string]: string } = {
  agent: "#4CAF50",
  patient: "#2196F3",
  secondary: "#9E9E9E",
  expert: "#FF9800",
};

type ViewMode = "visual" | "text";

export function EntityDisplay({ events = [] }: EntityDisplayProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("visual");
  const [expandedEntities, setExpandedEntities] = useState<Set<string>>(
    new Set()
  );
  const [showAllEntities, setShowAllEntities] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Build rich entity context for text view
  const entityContextMap = new Map<string, EntityContext>();
  const entityNameToId = new Map<string, string>();

  // First pass: map entity names to their first occurrence ID
  events.forEach((event) => {
    if (!event?.entities) return;
    event.entities.forEach((entity) => {
      if (!entity?.name || !entity?.id) return;
      if (!entityNameToId.has(entity.name)) {
        entityNameToId.set(entity.name, entity.id);
      }
    });
  });

  // Second pass: count mentions and build context
  events.forEach((event) => {
    if (!event?.entities) return;
    event.entities.forEach((entity) => {
      if (!entity?.name || !entity?.id) return;

      const canonicalId = entityNameToId.get(entity.name)!;
      const existingContext = entityContextMap.get(canonicalId) || {
        id: canonicalId,
        entity,
        frequency: 0,
        mentions: [],
      };

      existingContext.frequency += 1;
      existingContext.mentions.push({
        text: event.text,
        date:
          event.temporal_anchoring?.real_time ||
          event.temporal_anchoring?.anchor ||
          "Unknown date",
        topic: event.topic.main_topic,
        sentiment: event.topic.sentiment,
      });

      entityContextMap.set(canonicalId, existingContext);
    });
  });

  const sortedEntities = Array.from(entityContextMap.values()).sort(
    (a, b) => b.frequency - a.frequency
  );

  // Calculate role type and social role distributions
  const roleTypeCounts = new Map<string, number>();
  const socialRoleCounts = new Map<string, number>();
  const totalMentions = sortedEntities.reduce(
    (sum, { frequency }) => sum + frequency,
    0
  );

  sortedEntities.forEach(({ entity }) => {
    if (entity.role_type) {
      roleTypeCounts.set(
        entity.role_type,
        (roleTypeCounts.get(entity.role_type) || 0) + 1
      );
    }
    if (entity.social_role) {
      socialRoleCounts.set(
        entity.social_role,
        (socialRoleCounts.get(entity.social_role) || 0) + 1
      );
    }
  });

  const toggleEntity = (entityId: string) => {
    setExpandedEntities((prev) => {
      const next = new Set(prev);
      if (next.has(entityId)) {
        next.delete(entityId);
      } else {
        next.add(entityId);
      }
      return next;
    });
  };

  useEffect(() => {
    if (
      viewMode !== "visual" ||
      !events.length ||
      !svgRef.current ||
      !containerRef.current
    )
      return;

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();

    // Get entity mentions count and select top 5 by name
    const entityMentions = new Map<string, { entity: Entity; count: number }>();
    events.forEach((event) => {
      event.entities.forEach((entity) => {
        if (!entityMentions.has(entity.name)) {
          entityMentions.set(entity.name, { entity, count: 1 });
        } else {
          const current = entityMentions.get(entity.name)!;
          entityMentions.set(entity.name, { entity, count: current.count + 1 });
        }
      });
    });

    const top5Entities = Array.from(entityMentions.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((item) => item.entity);

    // Setup dimensions
    const margin = { top: 60, right: 40, bottom: 20, left: 60 };
    const containerWidth = containerRef.current.clientWidth;
    const minHeight = events.length * 20 + margin.top + margin.bottom;
    const containerHeight = Math.max(minHeight, 800);
    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;

    // Create SVG
    const svg = d3
      .select(svgRef.current)
      .attr("width", containerWidth)
      .attr("height", containerHeight);

    // Create main group
    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Calculate scales
    const xScale = d3
      .scaleBand()
      .domain(top5Entities.map((e) => e.name))
      .range([0, width])
      .padding(0.2);

    // Find min and max narrative time
    const minTime = Math.min(
      ...events.map((e) => e.temporal_anchoring.narrative_time)
    );
    const maxTime = Math.max(
      ...events.map((e) => e.temporal_anchoring.narrative_time)
    );

    const yScale = d3
      .scaleLinear()
      .domain([minTime, maxTime])
      .range([0, height]);

    // Draw entity columns
    top5Entities.forEach((entity) => {
      const x = xScale(entity.name)!;

      // Add entity labels with larger font and padding
      g.append("text")
        .attr("x", x + xScale.bandwidth() / 2)
        .attr("y", -25)
        .attr("text-anchor", "middle")
        .attr("fill", "#666")
        .attr("font-size", "14px")
        .attr("font-weight", "bold")
        .text(entity.name);

      // Add vertical guide line
      g.append("line")
        .attr("x1", x + xScale.bandwidth() / 2)
        .attr("y1", 0)
        .attr("x2", x + xScale.bandwidth() / 2)
        .attr("y2", height)
        .attr("stroke", ENTITY_COLORS[entity.role_type] || "#9E9E9E")
        .attr("stroke-width", 2)
        .attr("opacity", 0.3);
    });

    // Create tooltip
    const tooltip = d3
      .select(containerRef.current)
      .append("div")
      .attr(
        "class",
        "absolute bg-white p-2 rounded shadow-lg text-sm max-w-xs pointer-events-none z-10"
      )
      .style("opacity", 0);

    // Draw events
    const eventGroups = g
      .selectAll(".event-group")
      .data(events)
      .enter()
      .append("g")
      .attr("class", "event-group")
      .style("opacity", 1)
      .on("mouseenter", (e, d) => {
        // Highlight current group
        d3.select(e.currentTarget).style("opacity", 1).raise();

        // Dim other groups
        g.selectAll(".event-group")
          .filter((g) => g !== d)
          .style("opacity", 0.3);

        // Show tooltip
        tooltip
          .style("opacity", 1)
          .html(`Event ${d.temporal_anchoring.narrative_time}: ${d.text}`)
          .style("left", `${e.pageX + 10}px`)
          .style("top", `${e.pageY - 10}px`);
      })
      .on("mouseleave", (e) => {
        // Restore all groups opacity
        g.selectAll(".event-group").style("opacity", 1);

        // Hide tooltip
        tooltip.style("opacity", 0);
      });

    // Draw event elements within groups
    eventGroups.each(function (event) {
      const eventGroup = d3.select(this);
      const relevantEntities = event.entities.filter((entity) =>
        top5Entities.some((e) => e.name === entity.name)
      );

      if (relevantEntities.length > 0) {
        const y = yScale(event.temporal_anchoring.narrative_time);

        // Draw horizontal connection line if multiple entities
        if (relevantEntities.length > 1) {
          const xPoints = relevantEntities.map(
            (entity) => xScale(entity.name)! + xScale.bandwidth() / 2
          );
          const minX = Math.min(...xPoints);
          const maxX = Math.max(...xPoints);

          eventGroup
            .append("line")
            .attr("class", "connector")
            .attr("x1", minX)
            .attr("y1", y)
            .attr("x2", maxX)
            .attr("y2", y)
            .attr("stroke", "#9E9E9E")
            .attr("stroke-width", 2);
        }

        // Draw nodes for each entity
        relevantEntities.forEach((entity) => {
          const x = xScale(entity.name)! + xScale.bandwidth() / 2;

          const nodeGroup = eventGroup
            .append("g")
            .attr("class", "node")
            .attr("transform", `translate(${x},${y})`);

          // Outer circle
          nodeGroup
            .append("circle")
            .attr("class", "node-outer")
            .attr("r", 6)
            .attr("fill", "white")
            .attr("stroke", ENTITY_COLORS[entity.role_type] || "#9E9E9E")
            .attr("stroke-width", 2);

          // Inner circle
          nodeGroup
            .append("circle")
            .attr("class", "node-inner")
            .attr("r", 4)
            .attr("fill", ENTITY_COLORS[entity.role_type] || "#9E9E9E");
        });

        // Add invisible hover area to make interaction easier
        eventGroup
          .append("rect")
          .attr(
            "x",
            Math.min(...relevantEntities.map((e) => xScale(e.name)!)) - 10
          )
          .attr("y", y - 10)
          .attr(
            "width",
            Math.max(...relevantEntities.map((e) => xScale(e.name)!)) -
              Math.min(...relevantEntities.map((e) => xScale(e.name)!)) +
              xScale.bandwidth() +
              20
          )
          .attr("height", 20)
          .attr("fill", "transparent")
          .attr("class", "hover-area");
      }
    });

    // Add narrative time labels on y-axis with background
    const timeLabels = g
      .append("g")
      .selectAll("g")
      .data(events)
      .enter()
      .append("g");

    // Add white background for labels
    timeLabels
      .append("rect")
      .attr("x", -35)
      .attr("y", (d) => yScale(d.temporal_anchoring.narrative_time) - 10)
      .attr("width", 30)
      .attr("height", 20)
      .attr("fill", "white");

    // Add time labels
    timeLabels
      .append("text")
      .attr("x", -10)
      .attr("y", (d) => yScale(d.temporal_anchoring.narrative_time))
      .attr("text-anchor", "end")
      .attr("dominant-baseline", "middle")
      .attr("fill", "#666")
      .attr("font-size", "12px")
      .text((d) => d.temporal_anchoring.narrative_time);

    // Cleanup function
    return () => {
      tooltip.remove();
    };
  }, [events, viewMode]);

  if (!events.length) {
    return (
      <div className="p-6 h-full flex flex-col items-center justify-center">
        <p className="text-gray-500">No events data available</p>
      </div>
    );
  }

  return (
    <div className="p-6 h-full flex flex-col" ref={containerRef}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">Entity Timeline</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("visual")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              viewMode === "visual"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            Visual
          </button>
          <button
            onClick={() => setViewMode("text")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              viewMode === "text"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            Text
          </button>
        </div>
      </div>
      <div className="flex-grow relative overflow-auto">
        {viewMode === "visual" ? (
          <svg ref={svgRef} className="w-full" />
        ) : (
          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-2">
                Entity Distribution ({sortedEntities.length} unique entities,{" "}
                {totalMentions} total mentions)
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">By Role Type</h4>
                  <div className="space-y-1">
                    {Array.from(roleTypeCounts.entries()).map(
                      ([role, count]) => (
                        <div
                          key={role}
                          className="flex justify-between text-sm bg-gray-50 px-2 py-1 rounded"
                        >
                          <span className="capitalize">{role}</span>
                          <span className="text-gray-600">{count}</span>
                        </div>
                      )
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">By Social Role</h4>
                  <div className="space-y-1">
                    {Array.from(socialRoleCounts.entries()).map(
                      ([role, count]) => (
                        <div
                          key={role}
                          className="flex justify-between text-sm bg-gray-50 px-2 py-1 rounded"
                        >
                          <span className="capitalize">{role}</span>
                          <span className="text-gray-600">{count}</span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">
                Key Entities and Their Context
              </h3>
              <div className="space-y-4">
                {(showAllEntities
                  ? sortedEntities
                  : sortedEntities.slice(0, 5)
                ).map(({ entity, frequency, mentions }) => (
                  <div key={entity.id} className="bg-gray-50 p-3 rounded-lg">
                    <div
                      className="flex justify-between items-start mb-2 cursor-pointer"
                      onClick={() => toggleEntity(entity.id)}
                    >
                      <div className="flex items-center gap-2">
                        <button
                          className="w-5 h-5 rounded border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleEntity(entity.id);
                          }}
                        >
                          {expandedEntities.has(entity.id) ? "−" : "+"}
                        </button>
                        <div>
                          <span className="font-medium">{entity.name}</span>
                          <div className="text-sm text-gray-600">
                            {entity.role_type} • {entity.social_role}
                          </div>
                        </div>
                      </div>
                      <span className="text-sm bg-gray-200 px-2 py-1 rounded">
                        {frequency} mentions
                      </span>
                    </div>
                    {expandedEntities.has(entity.id) && (
                      <div className="space-y-2 mt-3 transition-all duration-200">
                        {mentions.map((mention, idx) => (
                          <div
                            key={idx}
                            className="text-sm bg-white p-2 rounded border border-gray-100"
                          >
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                              <span>{mention.date}</span>
                              <span className="flex items-center gap-1">
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    mention.sentiment.polarity === "positive"
                                      ? "bg-green-400"
                                      : mention.sentiment.polarity ===
                                        "negative"
                                      ? "bg-red-400"
                                      : "bg-gray-400"
                                  }`}
                                />
                                {mention.topic}
                              </span>
                            </div>
                            <p className="text-gray-700">{mention.text}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {sortedEntities.length > 5 && (
                <div className="mt-4 flex justify-center">
                  <button
                    onClick={() => setShowAllEntities(!showAllEntities)}
                    className="group relative inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                  >
                    {showAllEntities ? (
                      <>
                        Show Less
                        <svg
                          className="w-4 h-4 transition-transform group-hover:-translate-y-0.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 15l7-7 7 7"
                          />
                        </svg>
                      </>
                    ) : (
                      <>
                        Show {sortedEntities.length - 5} More Entities
                        <svg
                          className="w-4 h-4 transition-transform group-hover:translate-y-0.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
