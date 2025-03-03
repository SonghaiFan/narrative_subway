"use client";

import { Entity, NarrativeEvent } from "@/types/article";
import { useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";
import { ENTITY_CONFIG } from "./entity-config";
import { useTooltip } from "@/lib/tooltip-context";
import {
  EntityAttribute,
  getEntityAttributeValue,
  calculateDimensions,
  calculateMaxEntities,
  getEntityMentions,
  getVisibleEntities,
  calculateColumnLayout,
  createXScale,
  createYScale,
  createYAxis,
  getRelevantEntities,
  calculateConnectorPoints,
} from "./entity-visual.utils";

export interface EntityVisualProps {
  events: NarrativeEvent[];
  selectedAttribute: string;
  selectedEntityId?: string | null;
  onEntitySelect?: (id: string | null) => void;
  selectedEventId?: number | null;
  onEventSelect?: (id: number | null) => void;
}

export function EntityVisual({
  events,
  selectedAttribute,
  // selectedEntityId,
  // onEntitySelect,
  selectedEventId,
  onEventSelect,
}: EntityVisualProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const { showTooltip, hideTooltip, updatePosition } = useTooltip();

  // Function to update node styles based on selectedEventId
  const updateSelectedEventStyles = useCallback(
    (newSelectedId: number | null) => {
      if (!svgRef.current) return;

      // Reset all nodes to default style
      d3.select(svgRef.current)
        .selectAll(".event-node")
        .each(function () {
          const node = d3.select(this);
          // Only reset the stroke color, not the radius
          node.attr("stroke", "black");
        });

      // If we have a selected event, highlight it
      if (newSelectedId !== null) {
        const selectedNodes = d3
          .select(svgRef.current)
          .selectAll(`.event-node[data-event-index="${newSelectedId}"]`);

        if (!selectedNodes.empty()) {
          // Only change the stroke color for selection, not the radius
          selectedNodes.attr("stroke", "#3b82f6"); // Blue highlight for selected event
        }
      }
    },
    []
  );

  // Effect to handle selectedEventId changes without full re-render
  useEffect(() => {
    if (svgRef.current) {
      updateSelectedEventStyles(selectedEventId || null);
    }
  }, [selectedEventId]);

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

    // Setup dimensions first
    const { containerWidth, width, containerHeight, height } =
      calculateDimensions(containerRef.current.clientWidth, events.length);

    // Get entity mentions and calculate visible entities
    const entityMentions = getEntityMentions(events, selectedAttribute);
    const maxEntities = calculateMaxEntities(
      width,
      ENTITY_CONFIG.entity.minColumnWidth,
      ENTITY_CONFIG.entity.columnGap
    );
    const visibleEntities = getVisibleEntities(entityMentions, maxEntities);

    // Calculate layout dimensions
    const { totalColumnsWidth, leftOffset } = calculateColumnLayout(
      width,
      visibleEntities
    );

    // Create scales
    const xScale = createXScale(
      visibleEntities,
      selectedAttribute,
      totalColumnsWidth
    );
    const yScale = createYScale(events, height);
    const yAxis = createYAxis(yScale);

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
    visibleEntities.forEach((entity) => {
      const attrValue = getEntityAttributeValue(entity, selectedAttribute);
      const x = xScale(attrValue)!;
      const labelContainer = headerContent
        .append("div")
        .style("position", "absolute")
        .style("left", `${x + xScale.bandwidth() / 2}px`)
        .style("transform", "translateX(-50%)")
        .style("cursor", "pointer")
        .style("max-width", `${xScale.bandwidth()}px`)
        .on("mouseenter", function () {
          g.select(`.guide-line-${attrValue.replace(/\s+/g, "-")}`)
            .attr("opacity", 0.8)
            .attr("stroke-width", ENTITY_CONFIG.entity.lineStrokeWidth);
        })
        .on("mouseleave", function () {
          g.select(`.guide-line-${attrValue.replace(/\s+/g, "-")}`)
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
        .attr("title", attrValue)
        .text(attrValue);

      if (selectedAttribute === "name") {
        labelContainer
          .append("div")
          .style("font-size", "12px")
          .style("color", "#6B7280")
          .style("margin-top", "2px")
          .style("white-space", "nowrap")
          .style("overflow", "hidden")
          .style("text-overflow", "ellipsis")
          .text(entity.social_role || "");
      }
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
    visibleEntities.forEach((entity) => {
      const x = xScale(getEntityAttributeValue(entity, selectedAttribute))!;
      const entityColor = "#94a3b8";

      g.append("line")
        .attr(
          "class",
          `guide-line-${getEntityAttributeValue(
            entity,
            selectedAttribute
          ).replace(/\s+/g, "-")}`
        )
        .attr("x1", x + xScale.bandwidth() / 2)
        .attr("y1", 0)
        .attr("x2", x + xScale.bandwidth() / 2)
        .attr("y2", height)
        .attr("stroke", entityColor)
        .attr("stroke-width", ENTITY_CONFIG.entity.lineStrokeWidth)
        .attr("opacity", 0.3);
    });

    // Add y-axis with integer ticks
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
      const relevantEntities = getRelevantEntities(
        event,
        visibleEntities,
        selectedAttribute
      );

      if (relevantEntities.length > 0) {
        const y = yScale(event.temporal_anchoring.narrative_time);

        // Draw connector line if multiple entities
        if (relevantEntities.length > 1) {
          const { minX, maxX } = calculateConnectorPoints(
            relevantEntities,
            xScale,
            selectedAttribute
          );

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
          const x =
            xScale(getEntityAttributeValue(entity, selectedAttribute))! +
            xScale.bandwidth() / 2;

          // Add event node
          g.append("circle")
            .attr("class", "event-node")
            .attr("cx", x)
            .attr("cy", y)
            .attr("r", ENTITY_CONFIG.event.nodeRadius)
            .attr("fill", "white")
            .attr("stroke", "black")
            .attr("stroke-width", ENTITY_CONFIG.event.nodeStrokeWidth)
            .attr("data-event-index", event.index)
            .style("cursor", "pointer")
            .on("mouseover", function (e) {
              // Only change size on hover, not color
              d3.select(this)
                .transition()
                .duration(150)
                .attr("r", ENTITY_CONFIG.event.nodeRadius * 1.5);

              showTooltip(event, e.pageX, e.pageY, "entity");
            })
            .on("mousemove", function (e) {
              updatePosition(e.pageX, e.pageY);
            })
            .on("mouseout", function () {
              // Only reset size on mouseout, not color
              d3.select(this)
                .transition()
                .duration(150)
                .attr("r", ENTITY_CONFIG.event.nodeRadius);

              hideTooltip();
            })
            .on("click", function () {
              // Toggle selection
              onEventSelect?.(
                event.index === selectedEventId ? null : event.index
              );
            });
        });

        // 3. Finally draw the inner white connector on top
        if (relevantEntities.length > 1) {
          const { minX, maxX } = calculateConnectorPoints(
            relevantEntities,
            xScale,
            selectedAttribute
          );

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

    // Apply initial highlighting for selected event
    if (selectedEventId !== null && selectedEventId !== undefined) {
      updateSelectedEventStyles(selectedEventId);
    }
  }, [
    events,
    selectedAttribute,
    showTooltip,
    hideTooltip,
    updatePosition,
    onEventSelect,
  ]);

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
      <div className="flex-none bg-white sticky top-0 z-10 shadow-sm">
        <div
          ref={headerRef}
          style={{ height: `${ENTITY_CONFIG.header.height}px` }}
        />
      </div>
      <div ref={containerRef} className="flex-1 relative">
        <svg ref={svgRef} className="w-full h-full" />
      </div>
    </div>
  );
}
