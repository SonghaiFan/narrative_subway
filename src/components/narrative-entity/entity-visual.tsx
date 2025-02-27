"use client";

import { Entity, NarrativeEvent } from "@/types/article";
import { useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";
import {
  ENTITY_CONFIG,
  ENTITY_COLORS,
  SHARED_CONFIG,
  SOCIAL_ROLE_COLORS,
} from "../shared/visualization-config";
import { NarrativeTooltip, useNarrativeTooltip } from "../ui/narrative-tooltip";

interface EntityVisualProps {
  events: NarrativeEvent[];
}

export function EntityVisual({ events }: EntityVisualProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const { tooltipState, showTooltip, hideTooltip, updatePosition } =
    useNarrativeTooltip();

  // Function to update the visualization
  const updateVisualization = useCallback(() => {
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
      ENTITY_CONFIG.margin.top +
      ENTITY_CONFIG.margin.bottom;
    const containerHeight = Math.max(minHeight, ENTITY_CONFIG.minHeight);
    const width =
      containerWidth - ENTITY_CONFIG.margin.left - ENTITY_CONFIG.margin.right;
    const height =
      containerHeight - ENTITY_CONFIG.margin.top - ENTITY_CONFIG.margin.bottom;

    // Calculate responsive column width
    const totalGapWidth =
      (top5Entities.length - 1) * ENTITY_CONFIG.entity.columnGap;
    const availableWidth = width - totalGapWidth;
    const columnWidth = Math.min(
      ENTITY_CONFIG.entity.maxColumnWidth,
      Math.max(
        ENTITY_CONFIG.entity.minColumnWidth,
        availableWidth / top5Entities.length
      )
    );

    // Calculate total width including gaps
    const totalColumnsWidth = columnWidth * top5Entities.length + totalGapWidth;

    // Center the visualization if total width is less than available width
    const leftOffset =
      ENTITY_CONFIG.margin.left + (width - totalColumnsWidth) / 2;

    // Create scale with responsive width
    const xScale = d3
      .scaleBand()
      .domain(top5Entities.map((e) => e.name))
      .range([0, totalColumnsWidth])
      .padding(ENTITY_CONFIG.entity.columnPadding);

    // Create fixed header for entity labels
    const headerContainer = d3
      .select(headerRef.current)
      .style("width", `${containerWidth}px`)
      .style("margin-left", "0")
      .style("background-color", "white");

    // Create header content container with centered alignment
    const headerContent = headerContainer
      .append("div")
      .style("position", "relative")
      .style("margin-left", `${leftOffset}px`)
      .style("width", `${totalColumnsWidth}px`);

    // Create entity labels in the fixed header
    top5Entities.forEach((entity) => {
      const x = xScale(entity.name)!;
      const labelContainer = headerContent
        .append("div")
        .style("position", "absolute")
        .style("left", `${x + xScale.bandwidth() / 2}px`)
        .style("transform", "translateX(-50%)")
        .style("cursor", "pointer")
        .style("transition", "color 200ms")
        .style("max-width", `${xScale.bandwidth()}px`)
        .on("mouseenter", function () {
          d3.select(this).style(
            "color",
            SOCIAL_ROLE_COLORS[entity.social_role]
          );
          g.select(`.guide-line-${entity.name.replace(/\s+/g, "-")}`)
            .attr("opacity", 0.8)
            .attr("stroke-width", ENTITY_CONFIG.entity.lineStrokeWidth * 1.5);
        })
        .on("mouseleave", function () {
          d3.select(this).style("color", "#374151");
          g.select(`.guide-line-${entity.name.replace(/\s+/g, "-")}`)
            .attr("opacity", 0.3)
            .attr("stroke-width", ENTITY_CONFIG.entity.lineStrokeWidth);
        });

      labelContainer
        .append("div")
        .style("font-weight", "600")
        .style("font-size", `${ENTITY_CONFIG.entity.labelFontSize}px`)
        .style("color", "#374151")
        .style("white-space", "nowrap")
        .style("overflow", "hidden")
        .style("text-overflow", "ellipsis")
        .attr("title", entity.name)
        .text(entity.name);

      labelContainer
        .append("div")
        .style("font-size", "12px")
        .style("color", "#6B7280")
        .style("margin-top", "2px")
        .style("white-space", "nowrap")
        .style("overflow", "hidden")
        .style("text-overflow", "ellipsis")
        .text(entity.social_role);
    });

    // Create SVG
    const svg = d3
      .select(svgRef.current)
      .attr("width", containerWidth)
      .attr("height", containerHeight)
      .style("max-width", "100%");

    // Create main group with centered alignment
    const g = svg
      .append("g")
      .attr(
        "transform",
        `translate(${leftOffset},${ENTITY_CONFIG.margin.top})`
      );

    // Draw entity columns
    top5Entities.forEach((entity) => {
      const x = xScale(entity.name)!;
      const entityColor = SOCIAL_ROLE_COLORS[entity.social_role] || "#94a3b8";

      g.append("line")
        .attr("class", `guide-line-${entity.name.replace(/\s+/g, "-")}`)
        .attr("x1", x + xScale.bandwidth() / 2)
        .attr("y1", 0)
        .attr("x2", x + xScale.bandwidth() / 2)
        .attr("y2", height)
        .attr("stroke", entityColor)
        .attr("stroke-width", ENTITY_CONFIG.entity.lineStrokeWidth)
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
      .domain([0, Math.ceil(maxTime) + 1])
      .range([0, height])
      .nice();

    // Add y-axis with integer ticks
    const yAxis = d3
      .axisLeft(yScale)
      .tickSize(5)
      .tickPadding(5)
      .ticks(Math.ceil(maxTime) + 1)
      .tickFormat(d3.format("d"));

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

    // Draw event nodes
    events.forEach((event) => {
      // First collect all relevant entities for this event
      const relevantEntities = event.entities.filter((entity) =>
        top5Entities.find((e) => e.name === entity.name)
      );

      if (relevantEntities.length > 0) {
        const y = yScale(event.temporal_anchoring.narrative_time);

        // Draw connector line if multiple entities
        if (relevantEntities.length > 1) {
          const xPoints = relevantEntities.map(
            (entity) => xScale(entity.name)! + xScale.bandwidth() / 2
          );
          const minX = Math.min(...xPoints);
          const maxX = Math.max(...xPoints);

          // 1. First draw the outer black connector
          g.append("line")
            .attr("class", "connector-outer")
            .attr("x1", minX)
            .attr("y1", y)
            .attr("x2", maxX)
            .attr("y2", y)
            .attr("stroke", "#000")
            .attr(
              "stroke-width",
              ENTITY_CONFIG.event.connectorStrokeWidth +
                ENTITY_CONFIG.event.nodeStrokeWidth * 1.25
            )
            .attr("stroke-linecap", "round");
        }

        // 2. Draw nodes in the middle
        relevantEntities.forEach((entity) => {
          const x = xScale(entity.name)! + xScale.bandwidth() / 2;

          // Add event node
          g.append("circle")
            .attr("cx", x)
            .attr("cy", y)
            .attr("r", ENTITY_CONFIG.event.nodeRadius)
            .attr("fill", "white")
            .attr("stroke", "black")
            .attr("stroke-width", ENTITY_CONFIG.event.nodeStrokeWidth)
            .style("cursor", "pointer")
            .on("mouseover", function (e) {
              d3.select(this)
                .transition()
                .duration(150)
                .attr("r", ENTITY_CONFIG.event.nodeRadius * 1.5)
                .attr(
                  "stroke-width",
                  ENTITY_CONFIG.event.nodeStrokeWidth * 1.5
                );

              showTooltip(event, e.pageX, e.pageY);
            })
            .on("mousemove", function (e) {
              updatePosition(e.pageX, e.pageY);
            })
            .on("mouseout", function () {
              d3.select(this)
                .transition()
                .duration(150)
                .attr("r", ENTITY_CONFIG.event.nodeRadius)
                .attr("stroke-width", ENTITY_CONFIG.event.nodeStrokeWidth);

              hideTooltip();
            });
        });

        // 3. Finally draw the inner white connector on top
        if (relevantEntities.length > 1) {
          const xPoints = relevantEntities.map(
            (entity) => xScale(entity.name)! + xScale.bandwidth() / 2
          );
          const minX = Math.min(...xPoints);
          const maxX = Math.max(...xPoints);

          g.append("line")
            .attr("class", "connector-inner")
            .attr("x1", minX)
            .attr("y1", y)
            .attr("x2", maxX)
            .attr("y2", y)
            .attr("stroke", "#fff")
            .attr(
              "stroke-width",
              ENTITY_CONFIG.event.connectorStrokeWidth * 0.85
            )
            .attr("stroke-linecap", "round");
        }
      }
    });
  }, [events, showTooltip, hideTooltip, updatePosition]);

  // Initial setup and cleanup
  useEffect(() => {
    if (!containerRef.current) return;

    // Create ResizeObserver
    const resizeObserver = new ResizeObserver(() => {
      // Use requestAnimationFrame to throttle updates
      window.requestAnimationFrame(updateVisualization);
    });

    // Start observing
    resizeObserver.observe(containerRef.current);
    resizeObserverRef.current = resizeObserver;

    // Initial render
    updateVisualization();

    // Cleanup
    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, [updateVisualization]);

  return (
    <div className="w-full h-full flex flex-col overflow-auto">
      <div
        ref={headerRef}
        className="flex-none bg-white sticky top-0 z-10 shadow-sm"
        style={{ height: `${ENTITY_CONFIG.header.height}px` }}
      />
      <div ref={containerRef} className="flex-1 relative">
        <svg ref={svgRef} className="w-full h-full" />
        <NarrativeTooltip
          event={tooltipState.event}
          position={tooltipState.position}
          visible={tooltipState.visible}
          containerRef={containerRef}
          type="entity"
        />
      </div>
    </div>
  );
}
