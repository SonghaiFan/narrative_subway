"use client";

import { TimelineEvent } from "@/types/article";
import { useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";
import { TIME_CONFIG } from "../shared/visualization-config";

interface TimeVisualProps {
  events: TimelineEvent[];
  selectedEventId?: string;
}

export function NarrativeTimeVisual({
  events,
  selectedEventId,
}: TimeVisualProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  // Memoize the render function to avoid recreating it on every resize
  const renderVisualization = useCallback(() => {
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
    const dataPoints = validEvents.map((event) => ({
      event,
      realTime: new Date(event.temporal_anchoring.real_time!),
      narrativeTime: event.temporal_anchoring.narrative_time,
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

    // Add grid lines behind points
    const gridGroup = g.append("g").attr("class", "grid-group");

    gridGroup
      .append("g")
      .attr("class", "grid-lines")
      .selectAll("line")
      .data(yScale.ticks())
      .enter()
      .append("line")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", (d) => yScale(d))
      .attr("y2", (d) => yScale(d))
      .attr("stroke", "#e5e7eb")
      .attr("stroke-dasharray", "2,2");

    gridGroup
      .append("g")
      .attr("class", "grid-lines")
      .selectAll("line")
      .data(xScale.ticks())
      .enter()
      .append("line")
      .attr("x1", (d) => xScale(d))
      .attr("x2", (d) => xScale(d))
      .attr("y1", 0)
      .attr("y2", height)
      .attr("stroke", "#e5e7eb")
      .attr("stroke-dasharray", "2,2");

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
      .attr("transform", `translate(0,25)`)
      .call(xAxis)
      .style("font-size", `${TIME_CONFIG.axis.fontSize}px`)
      .call((g) => g.select(".domain").remove())
      .call((g) => g.selectAll(".tick line").attr("stroke", "#94a3b8"))
      .append("text")
      .attr("class", "axis-label")
      .attr("x", width / 2)
      .attr("y", -TIME_CONFIG.axis.labelOffset + 25)
      .attr("fill", "#64748b")
      .attr("text-anchor", "middle")
      .text("Real Time");

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
      .attr("stroke", "#6366f1")
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
      .attr("stroke", "#6366f1")
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
      .attr("stroke", "#6366f1")
      .attr("stroke-width", 1)
      .attr("stroke-opacity", 0.15)
      .attr("stroke-dasharray", "2,2");

    // Create tooltip
    const tooltip = d3
      .select(containerRef.current)
      .append("div")
      .attr(
        "class",
        "absolute bg-white p-3 rounded-lg shadow-lg text-sm max-w-md pointer-events-none z-20 hidden"
      )
      .style("border", "1px solid #e5e7eb")
      .style("position", "fixed");

    // Helper function to position tooltip
    const positionTooltip = (event: MouseEvent, content: string) => {
      const tooltipNode = tooltip.node() as HTMLElement;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Set content first to calculate dimensions
      tooltip
        .html(content)
        .style("visibility", "hidden")
        .classed("hidden", false);

      // Get tooltip dimensions after setting content
      const tooltipRect = tooltipNode.getBoundingClientRect();
      const tooltipWidth = tooltipRect.width;
      const tooltipHeight = tooltipRect.height;

      // Calculate position relative to mouse pointer
      let left = event.clientX + 15;
      let top = event.clientY + 15;

      // Adjust if tooltip would overflow right edge
      if (left + tooltipWidth > viewportWidth - 20) {
        left = event.clientX - tooltipWidth - 15;
      }

      // Adjust if tooltip would overflow bottom edge
      if (top + tooltipHeight > viewportHeight - 20) {
        top = event.clientY - tooltipHeight - 15;
      }

      // Ensure tooltip doesn't go beyond left edge
      left = Math.max(20, left);

      // Ensure tooltip doesn't go beyond top edge
      top = Math.max(20, top);

      // Apply final position and show tooltip
      tooltip
        .style("left", `${left}px`)
        .style("top", `${top}px`)
        .style("visibility", "visible");
    };

    // Add points with enhanced styling
    const points = g
      .selectAll(".point")
      .data(dataPoints)
      .enter()
      .append("g")
      .attr("class", "point")
      .attr(
        "transform",
        (d) => `translate(${xScale(d.realTime)},${yScale(d.narrativeTime)})`
      );

    points
      .append("circle")
      .attr("r", TIME_CONFIG.point.radius)
      .attr("fill", "white")
      .attr("stroke", "#6366f1")
      .attr("stroke-width", TIME_CONFIG.point.strokeWidth)
      .style("cursor", "pointer")
      .on("mouseenter", function (event, d) {
        // Highlight point
        d3.select(this)
          .transition()
          .duration(TIME_CONFIG.animation.duration)
          .attr("r", TIME_CONFIG.point.hoverRadius)
          .attr("stroke-width", TIME_CONFIG.point.strokeWidth * 1.5);

        // Show tooltip with enhanced content
        const content = `
          <div class="space-y-2">
            <div class="font-medium">Event ${
              d.event.temporal_anchoring.narrative_time
            }</div>
            <div class="text-gray-600">${d.event.text}</div>
            <div class="flex flex-wrap gap-2 mt-2">
              <span class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                ${new Date(
                  d.event.temporal_anchoring.real_time!
                ).toLocaleDateString()}
              </span>
              <span class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                ${d.event.temporal_anchoring.temporal_type}
              </span>
            </div>
          </div>
        `;
        positionTooltip(event, content);
      })
      .on("mousemove", function (event, d) {
        // Update tooltip position on mouse move
        const content = tooltip.html();
        positionTooltip(event, content);
      })
      .on("mouseleave", function () {
        // Reset point
        d3.select(this)
          .transition()
          .duration(TIME_CONFIG.animation.duration)
          .attr("r", TIME_CONFIG.point.radius)
          .attr("stroke-width", TIME_CONFIG.point.strokeWidth);

        // Hide tooltip
        tooltip.classed("hidden", true);
      });

    // Cleanup function
    return () => {
      tooltip.remove();
    };
  }, [events, selectedEventId]);

  // Initial render
  useEffect(() => {
    renderVisualization();
  }, [renderVisualization]);

  // Handle resize
  useEffect(() => {
    if (!containerRef.current) return;

    // Create resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      // Debounce the resize event
      const timeoutId = setTimeout(() => {
        renderVisualization();
      }, 100);

      return () => clearTimeout(timeoutId);
    });

    // Start observing the container
    resizeObserver.observe(containerRef.current);

    // Cleanup
    return () => {
      resizeObserver.disconnect();
    };
  }, [renderVisualization]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      renderVisualization();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [renderVisualization]);

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        ref={headerRef}
        className="bg-white sticky top-0 z-10 flex items-end border-b border-gray-200 h-10"
      />
      <svg
        ref={svgRef}
        className="w-full"
        style={{
          minHeight: TIME_CONFIG.minHeight,
          overflow: "visible",
        }}
      />
    </div>
  );
}
