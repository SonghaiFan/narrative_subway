"use client";

import { NarrativeEvent } from "@/types/article";
import { useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";
import { TOPIC_CONFIG } from "./topic-config";
import { useTooltip } from "@/lib/tooltip-context";
import {
  processEvents,
  getTopicCounts,
  getTopTopics,
  getScales,
  calculateDimensions,
  createAxes,
  createEdges,
  groupOverlappingPoints,
  calculateExpandedPositions,
  type DataPoint,
  type GroupedPoint,
} from "./topic-visual.utils";

interface TopicVisualProps {
  events: NarrativeEvent[];
  selectedEventId?: number | null;
  onEventSelect?: (id: number | null) => void;
  selectedTopic?: string | null;
  onTopicSelect?: (topic: string | null) => void;
}

interface PointState {
  x: number;
  y: number;
  isExpanded: boolean;
}

interface ChildPoint extends DataPoint {
  parentKey: string;
  index: number;
  total: number;
}

export function NarrativeTopicVisual({
  events,
  selectedEventId,
  onEventSelect,
  selectedTopic,
  onTopicSelect,
}: TopicVisualProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const pointStatesRef = useRef<Map<string, PointState>>(new Map());
  const { showTooltip, hideTooltip, updatePosition } = useTooltip();

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

    // Process data points
    const dataPoints = processEvents(events);
    const topicCounts = getTopicCounts(dataPoints);
    const topTopics = getTopTopics(topicCounts);

    // Calculate dimensions
    const { containerWidth, containerHeight, width, height } =
      calculateDimensions(
        containerRef.current.clientWidth,
        containerRef.current.clientHeight
      );

    // Create scales
    const { xScale, yScale } = getScales(dataPoints, topTopics, width, height);

    // Create axes
    const { xAxis, yAxis } = createAxes(xScale, yScale);

    // Create fixed header for x-axis
    const headerContainer = d3
      .select(headerRef.current)
      .style("width", `${containerWidth}px`)
      .style("margin-left", "0")
      .style("background-color", "white");

    // Create header content container
    const headerContent = headerContainer
      .append("div")
      .style("margin-left", `${TOPIC_CONFIG.margin.left}px`)
      .style("width", `${width}px`);

    // Add x-axis to header
    const headerSvg = headerContent
      .append("svg")
      .attr("width", width + TOPIC_CONFIG.margin.right)
      .attr("height", TOPIC_CONFIG.header.height)
      .style("overflow", "visible");

    headerSvg
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,30)`)
      .call(xAxis)
      .style("font-size", `${TOPIC_CONFIG.axis.fontSize}px`)
      .call((g) => g.select(".domain").remove())
      .call((g) => g.selectAll(".tick line").attr("stroke", "#94a3b8"));

    // Create SVG
    const svg = d3
      .select(svgRef.current)
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("viewBox", `0 0 ${containerWidth} ${containerHeight}`)
      .style("overflow", "visible");

    // Add background rect to handle clicks outside nodes
    svg
      .append("rect")
      .attr("width", containerWidth)
      .attr("height", containerHeight)
      .attr("fill", "transparent")
      .on("click", () => {
        // Close all expanded groups when clicking on the background
        groupedPoints.forEach((point) => {
          if (point.isExpanded) {
            point.isExpanded = false;
            pointStatesRef.current.set(point.key, {
              x: point.x,
              y: point.y,
              isExpanded: false,
            });

            // Find the parent node and collapse it
            const parentNode = parentNodes.filter(
              (d: GroupedPoint) => d.key === point.key
            );
            if (!parentNode.empty()) {
              const parent = parentNode.node();
              const children = d3.select(parent).selectAll(".child-point");
              const parentCircle = d3.select(parent).select("circle");
              const countText = d3.select(parent).select("text");

              // Collapse animation
              parentCircle
                .transition()
                .duration(200)
                .attr(
                  "r",
                  point.points.length > 1
                    ? TOPIC_CONFIG.point.radius * 1.2
                    : TOPIC_CONFIG.point.radius
                )
                .style("opacity", 1)
                .style("cursor", "pointer");

              countText.style("opacity", 1);

              children
                .transition()
                .duration(200)
                .style("opacity", 0)
                .style("pointer-events", "none");
            }
          }
        });
      });

    // Create main group with proper margins
    const g = svg
      .append("g")
      .attr(
        "transform",
        `translate(${TOPIC_CONFIG.margin.left},${TOPIC_CONFIG.margin.top})`
      );

    // Add y-axis
    g.append("g")
      .attr("class", "y-axis")
      .call(yAxis)
      .style("font-size", `${TOPIC_CONFIG.axis.fontSize}px`)
      .call((g) => g.select(".domain").remove())
      .call((g) => g.selectAll(".tick line").attr("stroke", "#94a3b8"))
      .call((g) =>
        g
          .selectAll(".tick text")
          .style("font-weight", "500")
          .style("text-anchor", "end")
          .attr("dy", "0.32em")
      );

    // Create edges
    const edges = createEdges(dataPoints);

    // Add edges group first (so it's underneath points)
    const edgesGroup = g
      .append("g")
      .attr("class", "edges")
      .attr("clip-path", "url(#plot-area)");

    // Create curved line generator for edges
    const lineGenerator = d3
      .line<[number, number]>()
      .x((d) => d[0])
      .y((d) => d[1])
      .curve(d3.curveCatmullRom);

    // Add edges with neutral color
    edgesGroup
      .selectAll(".edge")
      .data(edges)
      .enter()
      .append("path")
      .attr("class", "edge")
      .attr("d", (d) => {
        const sourceX = xScale(d.source.realTime);
        const sourceY = yScale(d.source.mainTopic)! + yScale.bandwidth() / 2;
        const targetX = xScale(d.target.realTime);
        const targetY = yScale(d.target.mainTopic)! + yScale.bandwidth() / 2;

        const midX = (sourceX + targetX) / 2;
        const points: [number, number][] = [
          [sourceX, sourceY],
          [midX, sourceY],
          [midX, targetY],
          [targetX, targetY],
        ];

        return lineGenerator(points);
      })
      .attr("fill", "none")
      .attr("stroke", "#94a3b8")
      .attr("stroke-width", TOPIC_CONFIG.edge.strokeWidth)
      .attr("stroke-opacity", TOPIC_CONFIG.edge.opacity)
      .attr("stroke-dasharray", TOPIC_CONFIG.edge.dashArray);

    // Add points group
    const pointsGroup = g
      .append("g")
      .attr("class", "points")
      .attr("clip-path", "url(#plot-area)");

    // Group overlapping points
    const groupedPoints = groupOverlappingPoints(dataPoints, xScale, yScale);

    // Create parent nodes
    const parentNodes = pointsGroup
      .selectAll<SVGGElement, GroupedPoint>(".point-group")
      .data(groupedPoints)
      .enter()
      .append("g")
      .attr("class", "point-group")
      .each(function (d: GroupedPoint) {
        const state = pointStatesRef.current.get(d.key);
        if (state) {
          d.isExpanded = state.isExpanded;
        }
      });

    // Add parent circles
    parentNodes
      .append("circle")
      .attr("class", "parent-point")
      .attr("cx", (d: GroupedPoint) => d.x)
      .attr("cy", (d: GroupedPoint) => d.y)
      .attr("r", (d: GroupedPoint) =>
        d.points.length > 1
          ? TOPIC_CONFIG.point.radius * 1.2
          : TOPIC_CONFIG.point.radius
      )
      .attr("fill", "white")
      .attr("stroke", "black")
      .attr("stroke-width", TOPIC_CONFIG.point.strokeWidth)
      .style("cursor", (d: GroupedPoint) =>
        d.points.length > 1 ? "pointer" : "default"
      )
      .each(function (d: GroupedPoint) {
        if (d.points.length > 1) {
          const parentNode = d3.select(this.parentElement);
          if (parentNode) {
            parentNode
              .append("text")
              .attr("x", d.x)
              .attr("y", d.y)
              .attr("dy", "0.35em")
              .attr("text-anchor", "middle")
              .style("font-size", "10px")
              .style("fill", "black")
              .style("pointer-events", "none")
              .text(d.points.length);
          }
        }
      });

    // Add child nodes (initially hidden)
    const childNodes = parentNodes
      .selectAll<SVGGElement, ChildPoint>(".child-point")
      .data<ChildPoint>((d: GroupedPoint) =>
        d.points.map((p: DataPoint, i: number) => ({
          ...p,
          parentKey: d.key,
          index: i,
          total: d.points.length,
        }))
      )
      .enter()
      .append("g")
      .attr("class", "child-point")
      .style("opacity", 0)
      .style("pointer-events", "none");

    childNodes
      .append("circle")
      .attr("cx", (d: ChildPoint) => {
        const parent = groupedPoints.find((g) => g.key === d.parentKey)!;
        const positions = calculateExpandedPositions(
          parent,
          TOPIC_CONFIG.point.radius
        );
        return positions[d.index].x;
      })
      .attr("cy", (d: ChildPoint) => {
        const parent = groupedPoints.find((g) => g.key === d.parentKey)!;
        const positions = calculateExpandedPositions(
          parent,
          TOPIC_CONFIG.point.radius
        );
        return positions[d.index].y;
      })
      .attr("r", TOPIC_CONFIG.point.radius)
      .attr("fill", "white")
      .attr("stroke", "black")
      .attr("stroke-width", TOPIC_CONFIG.point.strokeWidth)
      .style("cursor", "pointer");

    // Handle click events for parent nodes
    parentNodes.on("click", function (event: MouseEvent, d: GroupedPoint) {
      // If it's a group with multiple points, prioritize expand/collapse
      if (d.points.length > 1) {
        const isExpanded = !d.isExpanded;
        d.isExpanded = isExpanded;
        pointStatesRef.current.set(d.key, { x: d.x, y: d.y, isExpanded });

        const parent = d3.select(this);
        const children = parent.selectAll(".child-point");
        const parentCircle = parent.select("circle");
        const countText = parent.select("text");

        if (isExpanded) {
          // Expand animation
          parentCircle
            .transition()
            .duration(200)
            .attr("r", TOPIC_CONFIG.point.radius * 0.8)
            .style("opacity", 0.5)
            .style("cursor", "pointer");

          countText.style("opacity", 0);

          children
            .transition()
            .duration(200)
            .style("opacity", 1)
            .style("pointer-events", "all");
        } else {
          // Collapse animation
          parentCircle
            .transition()
            .duration(200)
            .attr(
              "r",
              d.points.length > 1
                ? TOPIC_CONFIG.point.radius * 1.2
                : TOPIC_CONFIG.point.radius
            )
            .style("opacity", 1)
            .style("cursor", "pointer");

          countText.style("opacity", 1);

          children
            .transition()
            .duration(200)
            .style("opacity", 0)
            .style("pointer-events", "none");
        }
      } else {
        // If it's a single point (not a group), handle selection
        const eventData = d.points[0].event;
        onEventSelect?.(
          eventData.index === selectedEventId ? null : eventData.index
        );
      }
    });

    // Handle hover events
    const handleMouseOver = function (this: Element, event: any, d: unknown) {
      if (!event.currentTarget) return;

      const target = d3.select(event.currentTarget as Element);
      target
        .transition()
        .duration(150)
        .attr("r", TOPIC_CONFIG.point.hoverRadius)
        .attr("stroke-width", TOPIC_CONFIG.point.hoverStrokeWidth);

      const eventData =
        "points" in d
          ? (d as GroupedPoint).points[0].event
          : (d as ChildPoint).event;
      showTooltip(eventData, event.pageX, event.pageY, "topic");
    };

    const handleMouseOut = function (this: Element, event: any, d: unknown) {
      if (!event.currentTarget) return;

      const target = d3.select(event.currentTarget as Element);
      const isParent = target.classed("parent-point");
      const parentData = isParent
        ? (d as GroupedPoint)
        : groupedPoints.find((g) => g.key === (d as ChildPoint).parentKey);

      if (!parentData) return;

      // Don't reset the style if this is the selected event
      const eventData =
        "points" in d
          ? (d as GroupedPoint).points[0].event
          : (d as ChildPoint).event;
      const isSelected = selectedEventId === eventData.index;

      if (!isSelected) {
        target
          .transition()
          .duration(150)
          .attr(
            "r",
            isParent && parentData.points.length > 1
              ? TOPIC_CONFIG.point.radius * 1.2
              : TOPIC_CONFIG.point.radius
          )
          .attr("stroke-width", TOPIC_CONFIG.point.strokeWidth);
      }

      hideTooltip();
    };

    // Add hover events to both parent and child nodes
    parentNodes
      .selectAll("circle")
      .on("mouseover", handleMouseOver)
      .on("mouseout", handleMouseOut)
      .on("mousemove", function (event) {
        updatePosition(event.pageX, event.pageY);
      });

    childNodes
      .selectAll("circle")
      .on("mouseover", handleMouseOver)
      .on("mouseout", handleMouseOut)
      .on("mousemove", function (event) {
        updatePosition(event.pageX, event.pageY);
      })
      .on("click", function (this: Element, event: any, d: unknown) {
        // For child nodes, we always handle selection
        const childPoint = d as ChildPoint;
        const eventData = childPoint.event;
        onEventSelect?.(
          eventData.index === selectedEventId ? null : eventData.index
        );
        event.stopPropagation(); // Prevent the click from bubbling up to the parent
      });

    // Highlight the selected event if any
    if (selectedEventId !== null && selectedEventId !== undefined) {
      // Find all circles (both parent and child) that represent the selected event
      parentNodes
        .selectAll("circle")
        .each(function (this: Element, d: unknown) {
          const eventData =
            "points" in d
              ? (d as GroupedPoint).points[0].event
              : (d as ChildPoint).event;
          if (eventData.index === selectedEventId) {
            d3.select(this)
              .attr("r", TOPIC_CONFIG.point.hoverRadius)
              .attr("stroke-width", TOPIC_CONFIG.point.hoverStrokeWidth)
              .attr("stroke", "#3b82f6"); // Use a highlight color (blue)
          }
        });

      childNodes.selectAll("circle").each(function (this: Element, d: unknown) {
        const childPoint = d as ChildPoint;
        if (childPoint.event.index === selectedEventId) {
          d3.select(this)
            .attr("r", TOPIC_CONFIG.point.hoverRadius)
            .attr("stroke-width", TOPIC_CONFIG.point.hoverStrokeWidth)
            .attr("stroke", "#3b82f6"); // Use a highlight color (blue)
        }
      });
    }
  }, [
    events,
    selectedEventId,
    selectedTopic,
    showTooltip,
    hideTooltip,
    updatePosition,
    onEventSelect,
    onTopicSelect,
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
      <div
        ref={headerRef}
        className="flex-none bg-white sticky top-0 z-10 shadow-sm"
        style={{ height: `${TOPIC_CONFIG.header.height}px` }}
      />
      <div ref={containerRef} className="flex-1 relative">
        <svg ref={svgRef} className="w-full h-full" />
      </div>
    </div>
  );
}
