"use client";

import { NarrativeEvent } from "@/types/article";
import { useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";
import { SHARED_CONFIG } from "../shared/visualization-config";
import { NarrativeTooltip, useNarrativeTooltip } from "../ui/narrative-tooltip";
import {
  processEvents,
  getTopicCounts,
  getTopTopics,
  getScales,
  getPointColors,
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
  selectedEventId?: string;
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
}: TopicVisualProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const pointStatesRef = useRef<Map<string, PointState>>(new Map());
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
      .style("margin-left", `${SHARED_CONFIG.margin.left}px`)
      .style("width", `${width}px`);

    // Add x-axis to header
    const headerSvg = headerContent
      .append("svg")
      .attr("width", width + SHARED_CONFIG.margin.right)
      .attr("height", SHARED_CONFIG.header.height)
      .style("overflow", "visible");

    headerSvg
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,30)`)
      .call(xAxis)
      .style("font-size", `${SHARED_CONFIG.axis.fontSize}px`)
      .call((g) => g.select(".domain").remove())
      .call((g) => g.selectAll(".tick line").attr("stroke", "#94a3b8"));

    // Create SVG
    const svg = d3
      .select(svgRef.current)
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("viewBox", `0 0 ${containerWidth} ${containerHeight}`)
      .style("overflow", "visible");

    // Create main group with proper margins
    const g = svg
      .append("g")
      .attr(
        "transform",
        `translate(${SHARED_CONFIG.margin.left},${SHARED_CONFIG.margin.top})`
      );

    // Add y-axis
    g.append("g")
      .attr("class", "y-axis")
      .call(yAxis)
      .style("font-size", `${SHARED_CONFIG.axis.fontSize}px`)
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
      .attr("stroke-width", SHARED_CONFIG.edge.strokeWidth)
      .attr("stroke-opacity", SHARED_CONFIG.edge.opacity)
      .attr("stroke-dasharray", SHARED_CONFIG.edge.dashArray);

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
          ? SHARED_CONFIG.point.radius * 1.2
          : SHARED_CONFIG.point.radius
      )
      .attr(
        "fill",
        (d: GroupedPoint) =>
          getPointColors(d.points[0].event.topic.sentiment).fill
      )
      .attr(
        "stroke",
        (d: GroupedPoint) =>
          getPointColors(d.points[0].event.topic.sentiment).stroke
      )
      .attr("stroke-width", SHARED_CONFIG.point.strokeWidth)
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
              .style(
                "fill",
                getPointColors(d.points[0].event.topic.sentiment).stroke
              )
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
          SHARED_CONFIG.point.radius
        );
        return positions[d.index].x;
      })
      .attr("cy", (d: ChildPoint) => {
        const parent = groupedPoints.find((g) => g.key === d.parentKey)!;
        const positions = calculateExpandedPositions(
          parent,
          SHARED_CONFIG.point.radius
        );
        return positions[d.index].y;
      })
      .attr("r", SHARED_CONFIG.point.radius)
      .attr(
        "fill",
        (d: ChildPoint) => getPointColors(d.event.topic.sentiment).fill
      )
      .attr(
        "stroke",
        (d: ChildPoint) => getPointColors(d.event.topic.sentiment).stroke
      )
      .attr("stroke-width", SHARED_CONFIG.point.strokeWidth)
      .style("cursor", "pointer");

    // Handle click events for parent nodes
    parentNodes.on("click", function (event: MouseEvent, d: GroupedPoint) {
      if (d.points.length <= 1) return;

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
          .attr("r", SHARED_CONFIG.point.radius * 0.8)
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
              ? SHARED_CONFIG.point.radius * 1.2
              : SHARED_CONFIG.point.radius
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
    });

    // Handle hover events
    const handleMouseOver = (event: MouseEvent, d: any) => {
      if (!event.currentTarget) return;

      const target = d3.select(event.currentTarget as Element);
      target
        .transition()
        .duration(150)
        .attr("r", SHARED_CONFIG.point.hoverRadius)
        .attr("stroke-width", SHARED_CONFIG.point.hoverStrokeWidth);

      const eventData = "points" in d ? d.points[0].event : d.event;
      showTooltip(eventData, event.pageX, event.pageY);
    };

    const handleMouseOut = (event: MouseEvent, d: any) => {
      if (!event.currentTarget) return;

      const target = d3.select(event.currentTarget as Element);
      const isParent = target.classed("parent-point");
      const parentData = isParent
        ? (d as GroupedPoint)
        : groupedPoints.find((g) => g.key === (d as ChildPoint).parentKey);

      if (!parentData) return;

      target
        .transition()
        .duration(150)
        .attr(
          "r",
          isParent && parentData.points.length > 1
            ? SHARED_CONFIG.point.radius * 1.2
            : SHARED_CONFIG.point.radius
        )
        .attr("stroke-width", SHARED_CONFIG.point.strokeWidth);

      hideTooltip();
    };

    // Add hover events to both parent and child nodes
    parentNodes
      .selectAll("circle")
      .on("mouseover", handleMouseOver)
      .on("mouseout", handleMouseOut)
      .on("mousemove", (event) => {
        updatePosition(event.pageX, event.pageY);
      });

    childNodes
      .selectAll("circle")
      .on("mouseover", handleMouseOver)
      .on("mouseout", handleMouseOut)
      .on("mousemove", (event) => {
        updatePosition(event.pageX, event.pageY);
      });
  }, [events, selectedEventId, showTooltip, hideTooltip, updatePosition]);

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
    <div className="w-full h-full flex flex-col overflow-hidden">
      <div
        ref={headerRef}
        className="flex-none bg-white sticky top-0 z-10 shadow-sm"
        style={{ height: `${SHARED_CONFIG.header.height}px` }}
      />
      <div ref={containerRef} className="flex-1 relative overflow-y-auto">
        <svg ref={svgRef} className="w-full h-full" />
        <NarrativeTooltip
          event={tooltipState.event}
          position={tooltipState.position}
          visible={tooltipState.visible}
          containerRef={containerRef}
          type="topic"
        />
      </div>
    </div>
  );
}
