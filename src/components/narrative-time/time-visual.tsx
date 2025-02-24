"use client";

import { NarrativeEvent } from "@/types/article";
import { useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";
import { TIME_CONFIG } from "../shared/visualization-config";
import {
  NarrativeTooltip,
  useNarrativeTooltip,
} from "../shared/narrative-tooltip";
import {
  DataPoint,
  LabelDatum,
  processEvents,
  getSortedPoints,
  getScales,
  createLabelData,
  getPointColors,
  createForceSimulation,
  calculateDimensions,
  createAxes,
  createLineGenerator,
} from "./time-visual.utils";

interface TimeVisualProps {
  events: NarrativeEvent[];
  selectedEventId?: string;
}

export function NarrativeTimeVisual({
  events,
  selectedEventId,
}: TimeVisualProps) {
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

    // Process data points
    const dataPoints = processEvents(events);
    const sortedPoints = getSortedPoints(dataPoints);

    // Calculate dimensions
    const { containerWidth, containerHeight, width, height } =
      calculateDimensions(containerRef.current.clientWidth, events.length);

    // Create scales
    const { xScale, yScale } = getScales(dataPoints, width, height);

    // Create fixed header for x-axis
    const headerContainer = d3
      .select(headerRef.current)
      .style("width", `${width}px`)
      .style("margin-left", `${TIME_CONFIG.margin.left}px`);

    // Create axes
    const { xAxis, yAxis } = createAxes(xScale, yScale);

    // Add x-axis to header
    const headerSvg = headerContainer
      .append("svg")
      .attr("width", width + TIME_CONFIG.margin.right)
      .attr("height", "40")
      .style("overflow", "visible");

    headerSvg
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,30)`)
      .call(xAxis)
      .style("font-size", `${TIME_CONFIG.axis.fontSize}px`)
      .call((g) => g.select(".domain").remove())
      .call((g) => g.selectAll(".tick line").attr("stroke", "#94a3b8"));

    // Create SVG
    const svg = d3
      .select(svgRef.current)
      .attr("width", containerWidth)
      .attr("height", containerHeight)
      .style("overflow", "visible");

    // Create main group with proper margins
    const g = svg
      .append("g")
      .attr(
        "transform",
        `translate(${TIME_CONFIG.margin.left},${TIME_CONFIG.margin.top})`
      );

    // Define clipping path for the plot area
    g.append("defs")
      .append("clipPath")
      .attr("id", "plot-area")
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", width)
      .attr("height", height);

    // Add y-axis
    g.append("g")
      .attr("class", "y-axis")
      .call(yAxis)
      .style("font-size", `${TIME_CONFIG.axis.fontSize}px`)
      .call((g) => g.select(".domain").remove())
      .call((g) => g.selectAll(".tick line").attr("stroke", "#94a3b8"))
      .append("text")
      .attr("class", "axis-label")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -TIME_CONFIG.axis.labelOffset)
      .attr("fill", "#64748b")
      .attr("text-anchor", "middle")
      .text("Narrative Time");

    // Create line generator
    const smoothLine = createLineGenerator(xScale, yScale);

    // Add main line with gradient stroke inside clipping path
    const lineGroup = g
      .append("g")
      .attr("class", "line-group")
      .attr("clip-path", "url(#plot-area)");

    // Add shadow effect for depth
    lineGroup
      .append("path")
      .datum(sortedPoints)
      .attr("class", "line-shadow")
      .attr("fill", "none")
      .attr("stroke", "black")
      .attr("stroke-width", TIME_CONFIG.curve.strokeWidth + 2)
      .attr("stroke-opacity", 0.1)
      .attr("stroke-linecap", "round")
      .attr("filter", "blur(4px)")
      .attr("d", smoothLine);

    // Add main line
    lineGroup
      .append("path")
      .datum(sortedPoints)
      .attr("class", "main-line")
      .attr("fill", "none")
      .attr("stroke", "black")
      .attr("stroke-width", TIME_CONFIG.curve.strokeWidth)
      .attr("stroke-opacity", TIME_CONFIG.curve.opacity)
      .attr("stroke-linecap", "round")
      .attr("d", smoothLine);

    // Create points group
    const pointsGroup = g
      .append("g")
      .attr("class", "points-group")
      .attr("clip-path", "url(#plot-area)");

    // Add points
    pointsGroup
      .selectAll(".point")
      .data(dataPoints)
      .enter()
      .append("circle")
      .attr("class", (d) => `point point-${d.index}`)
      .attr("cx", (d) => xScale(d.realTime))
      .attr("cy", (d) => yScale(d.narrativeTime))
      .attr("r", TIME_CONFIG.point.radius)
      .attr(
        "fill",
        (d) => getPointColors(d.event.topic.sentiment.intensity).fill
      )
      .attr(
        "stroke",
        (d) => getPointColors(d.event.topic.sentiment.intensity).stroke
      )
      .attr("stroke-width", TIME_CONFIG.point.strokeWidth)
      .style("cursor", "pointer")
      .on("mouseover", function (event, d) {
        const point = d3.select(this);
        point
          .transition()
          .duration(150)
          .attr("r", TIME_CONFIG.point.hoverRadius)
          .attr("stroke-width", TIME_CONFIG.point.hoverStrokeWidth);

        // Find and highlight corresponding label
        const label = labelsGroup.select(`.label-container-${d.index}`);
        label.raise();

        label
          .select(".label-background")
          .transition()
          .duration(150)
          .attr("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.15))")
          .attr("stroke", "#64748b");

        label
          .select(".connector")
          .transition()
          .duration(150)
          .attr("stroke", "#64748b")
          .attr("stroke-width", 1.5);

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
          .attr("r", TIME_CONFIG.point.radius)
          .attr("stroke-width", TIME_CONFIG.point.strokeWidth);

        // Reset corresponding label
        const label = labelsGroup.select(`.label-container-${d.index}`);

        label
          .select(".label-background")
          .transition()
          .duration(150)
          .attr("filter", "drop-shadow(0 1px 1px rgba(0,0,0,0.05))")
          .attr("stroke", "#94a3b8");

        label
          .select(".connector")
          .transition()
          .duration(150)
          .attr("stroke", "#94a3b8")
          .attr("stroke-width", 1);

        label.select(".connector").lower();

        hideTooltip();
      });

    // Create labels group
    const labelsGroup = g.append("g").attr("class", "labels");

    // Create label data
    const labelData = createLabelData(dataPoints, xScale, yScale);

    // Add label containers
    const labelContainers = labelsGroup
      .selectAll(".label-container")
      .data(labelData)
      .enter()
      .append("g")
      .attr("class", (d) => `label-container label-container-${d.index}`)
      .style("cursor", "pointer");

    // Add connector lines first (so they'll be underneath)
    const connectors = labelContainers
      .append("line")
      .attr("class", "connector")
      .attr("stroke", "#94a3b8")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "2,2")
      .lower();

    // Add label backgrounds
    const labelBackgrounds = labelContainers
      .append("rect")
      .attr("class", "label-background")
      .attr("rx", 5)
      .attr("ry", 5)
      .attr("fill", "white")
      .attr("stroke", "#94a3b8")
      .attr("stroke-width", 1)
      .attr("filter", "drop-shadow(0 1px 1px rgba(0,0,0,0.05))");

    // Add label text
    const labelTexts = labelContainers
      .append("text")
      .attr("class", "label-text")
      .style("font-size", "12px")
      .style("font-weight", "500")
      .style("fill", "#475569")
      .style("pointer-events", "none")
      .attr("x", 8)
      .attr("y", 16)
      .text((d) => d.text);

    // Calculate label dimensions and update data
    labelTexts.each(function (d) {
      const bbox = this.getBBox();
      d.width = bbox.width + 16;
      d.height = bbox.height + 16;
    });

    // Update background dimensions
    labelBackgrounds
      .attr("width", (d) => d.width)
      .attr("height", (d) => d.height);

    // Create force simulation
    const simulation = createForceSimulation(labelData, width, height);

    // Update positions on each tick
    simulation.on("tick", () => {
      labelContainers.attr(
        "transform",
        (d) => `translate(${d.x - d.width / 2},${d.y - d.height / 2})`
      );

      // Update connector lines with bottom attachment
      connectors
        .attr("x1", (d) => d.width / 2)
        .attr("y1", (d) => d.height)
        .attr("x2", (d) => d.point.x - (d.x - d.width / 2))
        .attr("y2", (d) => d.point.y - d.y + d.height / 2);
    });

    // Add hover interactions
    labelContainers
      .on("mouseover", function (event, d) {
        const container = d3.select(this);
        container.raise();

        // Find and highlight corresponding point
        pointsGroup
          .select(`.point-${d.index}`)
          .transition()
          .duration(150)
          .attr("r", TIME_CONFIG.point.hoverRadius)
          .attr("stroke-width", TIME_CONFIG.point.hoverStrokeWidth);

        container
          .select(".label-background")
          .transition()
          .duration(150)
          .attr("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.15))")
          .attr("stroke", "#64748b");

        container
          .select(".connector")
          .transition()
          .duration(150)
          .attr("stroke", "#64748b")
          .attr("stroke-width", 1.5);

        // Show tooltip
        const mouseEvent = event as MouseEvent;
        showTooltip(
          dataPoints[d.index].event,
          mouseEvent.pageX,
          mouseEvent.pageY
        );
      })
      .on("mousemove", function (event) {
        const mouseEvent = event as MouseEvent;
        updatePosition(mouseEvent.pageX, mouseEvent.pageY);
      })
      .on("mouseout", function (event, d) {
        const container = d3.select(this);

        // Reset corresponding point
        pointsGroup
          .select(`.point-${d.index}`)
          .transition()
          .duration(150)
          .attr("r", TIME_CONFIG.point.radius)
          .attr("stroke-width", TIME_CONFIG.point.strokeWidth);

        container
          .select(".label-background")
          .transition()
          .duration(150)
          .attr("filter", "drop-shadow(0 1px 1px rgba(0,0,0,0.05))")
          .attr("stroke", "#94a3b8");

        container
          .select(".connector")
          .transition()
          .duration(150)
          .attr("stroke", "#94a3b8")
          .attr("stroke-width", 1);

        // Lower the connector back underneath after hover
        container.select(".connector").lower();

        // Hide tooltip
        hideTooltip();
      });
  }, [events, selectedEventId, showTooltip, hideTooltip, updatePosition]);

  // Initial setup and cleanup
  useEffect(() => {
    if (!containerRef.current) return;

    // Create ResizeObserver
    const resizeObserver = new ResizeObserver((entries) => {
      // Use requestAnimationFrame to throttle updates
      window.requestAnimationFrame(() => {
        updateVisualization();
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
        style={{ height: `${TIME_CONFIG.header.height}px` }}
      />
      <div ref={containerRef} className="flex-1 relative">
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
