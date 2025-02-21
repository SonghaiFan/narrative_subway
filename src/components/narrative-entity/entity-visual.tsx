"use client";

import { TimelineEvent } from "@/types/article";
import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { ENTITY_CONFIG, ENTITY_COLORS } from "../shared/visualization-config";

interface EntityVisualProps {
  events: TimelineEvent[];
}

const TIMELINE_CONFIG = {
  entity: {
    labelFontSize: 14,
    lineStrokeWidth: 6,
    columnPadding: 0.2,
    headerHeight: 50,
  },
  event: {
    nodeRadius: 6,
    nodeStrokeWidth: 2,
    connectorStrokeWidth: 3,
    labelFontSize: 12,
  },
  animation: {
    duration: 200,
  },
  margin: {
    top: 30,
    right: 40,
    bottom: 20,
    left: 40,
  },
};

export function EntityVisual({ events }: EntityVisualProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (
      !events.length ||
      !svgRef.current ||
      !containerRef.current ||
      !headerRef.current
    )
      return;

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();
    d3.select(headerRef.current).selectAll("*").remove();

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
    const containerWidth = containerRef.current.clientWidth;
    const minHeight =
      events.length * 20 +
      TIMELINE_CONFIG.margin.top +
      TIMELINE_CONFIG.margin.bottom;
    const containerHeight = Math.max(minHeight, 800);
    const width =
      containerWidth -
      TIMELINE_CONFIG.margin.left -
      TIMELINE_CONFIG.margin.right;
    const height =
      containerHeight -
      TIMELINE_CONFIG.margin.top -
      TIMELINE_CONFIG.margin.bottom;

    // Create fixed header for entity labels
    const headerContainer = d3
      .select(headerRef.current)
      .style("width", `${width + TIMELINE_CONFIG.margin.left}px`)
      .style("margin-left", `${TIMELINE_CONFIG.margin.left}px`);

    // Calculate scales with minimum column width
    const columnWidth = Math.max(100, width / (top5Entities.length + 1)); // Add padding for better spacing
    const xScale = d3
      .scaleBand()
      .domain(top5Entities.map((e) => e.name))
      .range([0, columnWidth * top5Entities.length])
      .padding(TIMELINE_CONFIG.entity.columnPadding);

    // Create entity labels in the fixed header
    top5Entities.forEach((entity) => {
      const x = xScale(entity.name)!;
      const labelContainer = headerContainer
        .append("div")
        .style("position", "absolute")
        .style("left", `${x + xScale.bandwidth() / 2}px`)
        .style("transform", "translateX(-50%)")
        .style("cursor", "pointer")
        .style("transition", "color 200ms")
        .style("max-width", `${xScale.bandwidth()}px`)
        .on("mouseenter", function () {
          // Highlight corresponding column
          d3.select(this).style("color", ENTITY_COLORS[entity.role_type]);
          g.select(`.guide-line-${entity.name.replace(/\s+/g, "-")}`)
            .attr("opacity", 0.8)
            .attr("stroke-width", TIMELINE_CONFIG.entity.lineStrokeWidth * 1.5);
        })
        .on("mouseleave", function () {
          // Reset highlight
          d3.select(this).style("color", "#374151");
          g.select(`.guide-line-${entity.name.replace(/\s+/g, "-")}`)
            .attr("opacity", 0.3)
            .attr("stroke-width", TIMELINE_CONFIG.entity.lineStrokeWidth);
        });

      // Entity name with truncation
      labelContainer
        .append("div")
        .style("font-weight", "600")
        .style("font-size", `${TIMELINE_CONFIG.entity.labelFontSize}px`)
        .style("color", "#374151")
        .style("white-space", "nowrap")
        .style("overflow", "hidden")
        .style("text-overflow", "ellipsis")
        .attr("title", entity.name) // Add tooltip for full name
        .text(entity.name);

      // Add role type label
      labelContainer
        .append("div")
        .style("font-size", "12px")
        .style("color", "#6B7280")
        .style("margin-top", "2px")
        .style("white-space", "nowrap")
        .style("overflow", "hidden")
        .style("text-overflow", "ellipsis")
        .text(entity.role_type);
    });

    // Create SVG with adjusted width
    const svg = d3
      .select(svgRef.current)
      .attr(
        "width",
        width + TIMELINE_CONFIG.margin.left + TIMELINE_CONFIG.margin.right
      )
      .attr("height", containerHeight)
      .style("max-width", "100%"); // Ensure SVG doesn't overflow

    // Create tooltip
    const tooltip = d3
      .select(containerRef.current)
      .append("div")
      .attr(
        "class",
        "absolute bg-white p-3 rounded-lg shadow-lg text-sm max-w-md pointer-events-none z-20"
      )
      .style("opacity", 0)
      .style("border", "1px solid #e5e7eb")
      .style("position", "fixed") // Change to fixed positioning
      .style("max-width", "300px") // Limit tooltip width
      .style("word-wrap", "break-word"); // Allow text wrapping

    // Helper function to position tooltip
    const positionTooltip = (event: MouseEvent, content: string) => {
      const containerRect = containerRef.current!.getBoundingClientRect();
      const mouseX = event.clientX;
      const mouseY = event.clientY;

      tooltip
        .style("opacity", 1)
        .html(content)
        .style("visibility", "hidden") // Hide temporarily to measure size
        .style("display", "block");

      // Get tooltip dimensions
      const tooltipNode = tooltip.node() as HTMLElement;
      const tooltipRect = tooltipNode.getBoundingClientRect();

      // Calculate position to keep tooltip within container
      let left = mouseX + 15;
      let top = mouseY - 15;

      // Adjust horizontal position if tooltip would overflow right edge
      if (left + tooltipRect.width > containerRect.right - 10) {
        left = mouseX - tooltipRect.width - 15;
      }

      // Adjust vertical position if tooltip would overflow bottom edge
      if (top + tooltipRect.height > containerRect.bottom - 10) {
        top = mouseY - tooltipRect.height - 15;
      }

      // Ensure tooltip doesn't go beyond left edge
      left = Math.max(containerRect.left + 10, left);

      // Ensure tooltip doesn't go beyond top edge
      top = Math.max(containerRect.top + 10, top);

      tooltip
        .style("left", `${left}px`)
        .style("top", `${top}px`)
        .style("visibility", "visible"); // Show tooltip again
    };

    // Create main group
    const g = svg
      .append("g")
      .attr(
        "transform",
        `translate(${TIMELINE_CONFIG.margin.left},${TIMELINE_CONFIG.margin.top})`
      );

    // Draw entity columns with improved styling
    top5Entities.forEach((entity) => {
      const x = xScale(entity.name)!;
      const entityColor = ENTITY_COLORS[entity.role_type] || "#9E9E9E";

      // Add vertical guide line
      g.append("line")
        .attr("class", `guide-line-${entity.name.replace(/\s+/g, "-")}`)
        .attr("x1", x + xScale.bandwidth() / 2)
        .attr("y1", 0)
        .attr("x2", x + xScale.bandwidth() / 2)
        .attr("y2", height)
        .attr("stroke", entityColor)
        .attr("stroke-width", TIMELINE_CONFIG.entity.lineStrokeWidth)
        .attr("opacity", 0.3);
    });

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
      .range([0, height])
      .nice();

    // Add y-axis with styling
    const yAxis = d3.axisLeft(yScale).tickSize(5).tickPadding(5);

    g.append("g")
      .attr("class", "y-axis")
      .call(yAxis)
      .style("font-size", "12px")
      .call((g) => g.select(".domain").remove())
      .call((g) => g.selectAll(".tick line").attr("stroke", "#94a3b8"))
      .append("text")
      .attr("class", "axis-label")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -40)
      .attr("fill", "#64748b")
      .attr("text-anchor", "middle")
      .text("Narrative Time");

    // Draw events
    const eventGroups = g
      .selectAll(".event-group")
      .data(events)
      .enter()
      .append("g")
      .attr("class", "event-group")
      .on("mouseenter", (e, d) => {
        // Only raise the current group to front
        d3.select(e.currentTarget).raise();

        // Show tooltip with enhanced content
        const content = `
          <div class="space-y-2">
            <div class="font-medium">Event ${
              d.temporal_anchoring.narrative_time
            }</div>
            <div class="text-gray-600">${d.text}</div>
            <div class="flex flex-wrap gap-2 text-xs">
              <span class="text-gray-500">${d.temporal_anchoring.anchor}</span>
              <span class="px-2 py-0.5 bg-gray-100 rounded-full">${
                d.topic.main_topic
              }</span>
            </div>
            <div class="flex flex-wrap gap-2 text-xs">
              ${d.entities
                .map(
                  (entity) => `
                <span class="px-2 py-0.5 rounded" style="background-color: ${
                  ENTITY_COLORS[entity.role_type]
                }20; color: ${ENTITY_COLORS[entity.role_type]}">
                  ${entity.name}
                </span>
              `
                )
                .join("")}
            </div>
          </div>
        `;
        positionTooltip(e, content);
      })
      .on("mousemove", (e) => {
        // Update tooltip position on mouse move if needed
        const tooltipNode = tooltip.node() as HTMLElement;
        const content = tooltipNode.innerHTML;
        positionTooltip(e, content);
      })
      .on("mouseleave", () => {
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

          // 1. First draw the outer black connector
          eventGroup
            .append("line")
            .attr("class", "connector-outer")
            .attr("x1", minX)
            .attr("y1", y)
            .attr("x2", maxX)
            .attr("y2", y)
            .attr("stroke", "#000")
            .attr(
              "stroke-width",
              TIMELINE_CONFIG.event.connectorStrokeWidth +
                TIMELINE_CONFIG.event.nodeStrokeWidth * 1.25
            )
            .attr("stroke-linecap", "round");
        }

        // 2. Then draw all nodes
        relevantEntities.forEach((entity) => {
          const x = xScale(entity.name)! + xScale.bandwidth() / 2;

          const nodeGroup = eventGroup
            .append("g")
            .attr("class", "node")
            .attr("transform", `translate(${x},${y})`);

          // Outer circle (black border)
          nodeGroup
            .append("circle")
            .attr("class", "node-outer")
            .attr("r", TIMELINE_CONFIG.event.nodeRadius)
            .attr("fill", "white")
            .attr("stroke", "#000")
            .attr("stroke-width", TIMELINE_CONFIG.event.nodeStrokeWidth);
        });

        // 3. Finally draw the inner white connector on top
        if (relevantEntities.length > 1) {
          const xPoints = relevantEntities.map(
            (entity) => xScale(entity.name)! + xScale.bandwidth() / 2
          );
          const minX = Math.min(...xPoints);
          const maxX = Math.max(...xPoints);

          eventGroup
            .append("line")
            .attr("class", "connector-inner")
            .attr("x1", minX)
            .attr("y1", y)
            .attr("x2", maxX)
            .attr("y2", y)
            .attr("stroke", "#fff")
            .attr(
              "stroke-width",
              TIMELINE_CONFIG.event.connectorStrokeWidth * 0.85
            )
            .attr("stroke-linecap", "round");
        }

        // 4. Add invisible hover area last
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

    // Cleanup function
    return () => {
      tooltip.remove();
    };
  }, [events]);

  return (
    <div className="entity-visual relative w-full" ref={containerRef}>
      <div
        ref={headerRef}
        className="bg-white sticky top-0 z-10 flex items-end  border-b border-gray-200 h-10"
      />
      <svg
        ref={svgRef}
        className="w-full"
        style={{
          minHeight: "800px",
          overflow: "visible", // Allow labels to overflow if needed
        }}
      />
    </div>
  );
}
