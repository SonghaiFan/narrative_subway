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

    // Create fixed header for x-axis
    const headerContainer = d3
      .select(headerRef.current)
      .style("width", `${width}px`)
      .style("margin-left", `${SHARED_CONFIG.margin.left}px`);

    // Create axes
    const { xAxis, yAxis } = createAxes(xScale, yScale);

    // Add x-axis to header
    const headerSvg = headerContainer
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

    // Add points
    const pointsGroup = g.append("g").attr("class", "points-group");

    pointsGroup
      .selectAll(".point")
      .data(dataPoints)
      .enter()
      .append("circle")
      .attr("class", (d) => `point point-${d.index}`)
      .attr("cx", (d) => xScale(d.realTime))
      .attr("cy", (d) => yScale(d.mainTopic)! + yScale.bandwidth() / 2)
      .attr("r", SHARED_CONFIG.point.radius)
      .attr("fill", (d) => getPointColors(d.sentiment).fill)
      .attr("stroke", (d) => getPointColors(d.sentiment).stroke)
      .attr("stroke-width", SHARED_CONFIG.point.strokeWidth)
      .style("cursor", "pointer")
      .on("mouseover", function (event, d) {
        const point = d3.select(this);
        point
          .transition()
          .duration(150)
          .attr("r", SHARED_CONFIG.point.hoverRadius)
          .attr("stroke-width", SHARED_CONFIG.point.hoverStrokeWidth);

        showTooltip(d.event, event.pageX, event.pageY);
      })
      .on("mousemove", function (event) {
        updatePosition(event.pageX, event.pageY);
      })
      .on("mouseout", function (event, d) {
        const point = d3.select(this);
        point
          .transition()
          .duration(150)
          .attr("r", SHARED_CONFIG.point.radius)
          .attr("stroke-width", SHARED_CONFIG.point.strokeWidth);

        hideTooltip();
      });
  }, [events, selectedEventId, showTooltip, hideTooltip, updatePosition]);

  // Initial setup and cleanup
  useEffect(() => {
    if (!containerRef.current) return;

    // Create ResizeObserver
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      // Get the actual content dimensions
      const contentRect = entry.contentRect;

      // Use requestAnimationFrame to throttle updates
      window.requestAnimationFrame(() => {
        if (containerRef.current) {
          // Force a style recalculation to get accurate dimensions
          containerRef.current.style.height = "100%";
          updateVisualization();
        }
      });
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
    <div className="w-full h-full flex flex-col">
      <div
        ref={headerRef}
        className="flex-none bg-white sticky top-0 z-10 flex items-end border-b border-gray-200"
        style={{ height: `${SHARED_CONFIG.header.height}px` }}
      />
      <div ref={containerRef} className="flex-1 relative overflow-hidden">
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
