"use client";

import { NarrativeEvent } from "@/types/article";
import { useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";
import { TIME_CONFIG, SHARED_CONFIG } from "../shared/visualization-config";
import {
  NarrativeTooltip,
  useNarrativeTooltip,
} from "../shared/narrative-tooltip";

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

    // Filter events with real_time
    const validEvents = events.filter((e) => e.temporal_anchoring.real_time);

    // Parse dates and create data points
    const dataPoints = validEvents.map((event, index) => ({
      event,
      realTime: new Date(event.temporal_anchoring.real_time!),
      narrativeTime: event.temporal_anchoring.narrative_time,
      index, // Add index to track position
    }));

    // Setup dimensions
    const containerWidth = containerRef.current.clientWidth;
    const minHeight =
      events.length * 20 + TIME_CONFIG.margin.top + TIME_CONFIG.margin.bottom;
    const containerHeight = Math.max(minHeight, TIME_CONFIG.minHeight);
    const width =
      containerWidth - TIME_CONFIG.margin.left - TIME_CONFIG.margin.right;
    const height =
      containerHeight - TIME_CONFIG.margin.top - TIME_CONFIG.margin.bottom;

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

    // Create scales
    const xScale = d3
      .scaleTime()
      .domain(d3.extent(dataPoints, (d) => d.realTime) as [Date, Date])
      .range([0, width])
      .nice();

    // Find min and max narrative time
    const minTime = Math.min(
      ...events.map((e) => e.temporal_anchoring.narrative_time)
    );
    const maxTime = Math.max(
      ...events.map((e) => e.temporal_anchoring.narrative_time)
    );

    // Fixed y-scale with dynamic domain based on actual data
    const yScale = d3
      .scaleLinear()
      .domain([minTime, maxTime])
      .range([0, height])
      .nice();

    // Sort data points by narrative time for proper path following
    const sortedPoints = [...dataPoints].sort((a, b) => {
      // First sort by narrative time
      const timeCompare = a.narrativeTime - b.narrativeTime;
      if (timeCompare !== 0) return timeCompare;
      // If narrative times are equal, sort by real time
      return a.realTime.getTime() - b.realTime.getTime();
    });

    // Create path generator with monotone interpolation
    const smoothLine = d3
      .line<(typeof dataPoints)[0]>()
      .x((d) => xScale(d.realTime))
      .y((d) => yScale(d.narrativeTime))
      .curve(d3.curveMonotoneY); // Use monotoneY for better vertical progression

    // Create fixed header for x-axis
    const headerContainer = d3
      .select(headerRef.current)
      .style("width", `${width}px`)
      .style("margin-left", `${TIME_CONFIG.margin.left}px`);

    // Add x-axis to header
    const headerSvg = headerContainer
      .append("svg")
      .attr("width", width + TIME_CONFIG.margin.right)
      .attr("height", "40")
      .style("overflow", "visible");

    const xAxis = d3
      .axisTop(xScale)
      .tickSize(TIME_CONFIG.axis.tickSize)
      .tickPadding(TIME_CONFIG.axis.tickPadding);

    headerSvg
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,30)`)
      .call(xAxis)
      .style("font-size", `${TIME_CONFIG.axis.fontSize}px`)
      .call((g) => g.select(".domain").remove())
      .call((g) => g.selectAll(".tick line").attr("stroke", "#94a3b8"));

    // Add y-axis
    const yAxis = d3
      .axisLeft(yScale)
      .tickSize(TIME_CONFIG.axis.tickSize)
      .tickPadding(TIME_CONFIG.axis.tickPadding);

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

    // Add connecting lines between consecutive points inside clipping path
    lineGroup
      .selectAll(".connector")
      .data(sortedPoints.slice(0, -1))
      .enter()
      .append("line")
      .attr("class", "connector")
      .attr("x1", (d) => xScale(d.realTime))
      .attr("y1", (d) => yScale(d.narrativeTime))
      .attr("x2", (d, i) => xScale(sortedPoints[i + 1].realTime))
      .attr("y2", (d, i) => yScale(sortedPoints[i + 1].narrativeTime))
      .attr("stroke", "black")
      .attr("stroke-width", 1)
      .attr("stroke-opacity", 0.15)
      .attr("stroke-dasharray", "2,2");

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
      .attr("class", (d) => `point point-${d.index}`) // Add index-based class
      .attr("cx", (d) => xScale(d.realTime))
      .attr("cy", (d) => yScale(d.narrativeTime))
      .attr("r", TIME_CONFIG.point.radius)
      .attr("fill", (d) =>
        d.event.topic.sentiment.intensity > 0
          ? TIME_CONFIG.point.positiveFill
          : d.event.topic.sentiment.intensity < 0
          ? TIME_CONFIG.point.negativeFill
          : TIME_CONFIG.point.neutralFill
      )
      .attr("stroke", (d) =>
        d.event.topic.sentiment.intensity > 0
          ? TIME_CONFIG.point.positiveStroke
          : d.event.topic.sentiment.intensity < 0
          ? TIME_CONFIG.point.negativeStroke
          : TIME_CONFIG.point.neutralStroke
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

    // Create force-directed label data
    interface LabelDatum extends d3.SimulationNodeDatum {
      id: number;
      x: number;
      y: number;
      text: string;
      point: { x: number; y: number };
      width: number;
      height: number;
      index: number; // Add index to interface
    }

    const labelData: LabelDatum[] = dataPoints.map((d, i) => ({
      id: i,
      x: xScale(d.realTime),
      y: yScale(d.narrativeTime) - 30,
      text:
        d.event.text.length > 30
          ? d.event.text.slice(0, 27) + "..."
          : d.event.text,
      point: {
        x: xScale(d.realTime),
        y: yScale(d.narrativeTime),
      },
      width: 0,
      height: 0,
      fx: undefined,
      fy: undefined,
      index: d.index, // Use the same index from dataPoints
    }));

    // Create labels group
    const labelsGroup = g.append("g").attr("class", "labels");

    // Add label containers
    const labelContainers = labelsGroup
      .selectAll(".label-container")
      .data(labelData)
      .enter()
      .append("g")
      .attr("class", (d) => `label-container label-container-${d.index}`) // Add index-based class
      .style("cursor", "pointer");

    // Add connector lines first (so they'll be underneath)
    const connectors = labelContainers
      .append("line")
      .attr("class", "connector")
      .attr("stroke", "#94a3b8")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "2,2")
      .lower(); // Force connectors to be underneath

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
    const simulation = d3
      .forceSimulation<LabelDatum>(labelData)
      .force(
        "collision",
        d3
          .forceCollide<LabelDatum>()
          .radius(
            (d) => Math.sqrt(d.width / 2 + d.height / 2) // Reduced padding
          )
          .strength(0.2) // Reduced strength to allow slight overlap
      )
      .force(
        "y",
        d3
          .forceY<LabelDatum>()
          .y((d) => d.point.y - 30) // Reduced distance from point
          .strength(0.15) // Increased strength for more compact layout
      )
      .force("boundary", () => {
        for (let node of labelData) {
          // Keep x position fixed at point x, constrained within bounds
          node.x = Math.max(
            node.width / 2,
            Math.min(width - node.width / 2, node.point.x)
          );
          // Only constrain y within bounds with reduced padding
          node.y = Math.max(
            node.height / 2 - 2,
            Math.min(height - node.height / 2 + 2, node.y)
          );
        }
      });

    // Update positions on each tick
    simulation.on("tick", () => {
      labelContainers.attr(
        "transform",
        (d) => `translate(${d.x - d.width / 2},${d.y - d.height / 2})`
      );

      // Update connector lines with bottom attachment
      connectors
        .attr("x1", (d) => d.width / 2) // Start from middle of label
        .attr("y1", (d) => d.height) // Start from bottom of label
        .attr("x2", (d) => d.point.x - (d.x - d.width / 2)) // End at point x
        .attr("y2", (d) => d.point.y - d.y + d.height / 2); // End at point y
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
        style={{ height: `${SHARED_CONFIG.header.height}px` }}
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
