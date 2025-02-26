"use client";

import { NarrativeEvent } from "@/types/article";
import { useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";
import { SHARED_CONFIG } from "../shared/visualization-config";
import {
  NarrativeTooltip,
  useNarrativeTooltip,
} from "../shared/narrative-tooltip";
import {
  processEvents,
  getTopicCounts,
  getTopTopics,
  getScales,
  getPointColors,
  calculateDimensions,
  createAxes,
  createEdges,
} from "./topic-visual.utils";

interface TopicVisualProps {
  events: NarrativeEvent[];
  selectedEventId?: string;
}

export function NarrativeTopicVisual({
  events,
  selectedEventId,
}: TopicVisualProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const isDraggingRef = useRef(false);
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
      .attr("stroke-width", 1.5)
      .attr("stroke-opacity", 0.4)
      .attr("stroke-dasharray", "4,4");

    // Add points group
    const pointsGroup = g
      .append("g")
      .attr("class", "points")
      .attr("clip-path", "url(#plot-area)");

    // Add points with sentiment-based colors
    pointsGroup
      .selectAll(".point")
      .data(dataPoints)
      .enter()
      .append("circle")
      .attr("class", "point")
      .attr("cx", (d) => xScale(d.realTime))
      .attr("cy", (d) => yScale(d.mainTopic)! + yScale.bandwidth() / 2)
      .attr("r", SHARED_CONFIG.point.radius)
      .attr("fill", (d) => getPointColors(d.sentiment).fill)
      .attr("stroke", (d) => getPointColors(d.sentiment).stroke)
      .attr("stroke-width", SHARED_CONFIG.point.strokeWidth)
      .style("cursor", "pointer")
      .on("mouseover", function (event, d) {
        const point = d3.select(this);
        point.transition().duration(200).attr("r", 7).attr("stroke-width", 2);

        // Highlight related edges
        edgesGroup
          .selectAll(".edge")
          .filter((edge: Edge) => edge.source === d || edge.target === d)
          .transition()
          .duration(200)
          .attr("stroke-opacity", 0.8)
          .attr("stroke-width", 2);

        showTooltip(d.event, event.pageX, event.pageY);
      })
      .on("mouseout", function (event, d) {
        const point = d3.select(this);
        point.transition().duration(200).attr("r", 5).attr("stroke-width", 1.5);

        // Reset edge styles
        edgesGroup
          .selectAll(".edge")
          .transition()
          .duration(200)
          .attr("stroke-opacity", 0.4)
          .attr("stroke-width", 1.5);

        hideTooltip();
      })
      .on("mousemove", function (event) {
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
        />
      </div>
    </div>
  );
}
