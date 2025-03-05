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
  onTopicSelect,
}: TopicVisualProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const pointStatesRef = useRef<Map<string, PointState>>(new Map());
  const selectedEventIdRef = useRef<number | null>(null);
  const { showTooltip, hideTooltip, updatePosition } = useTooltip();

  // Keep the ref in sync with the prop
  useEffect(() => {
    selectedEventIdRef.current = selectedEventId ?? null;
  }, [selectedEventId]);

  // Function to generate unique IDs for nodes
  const getParentNodeId = useCallback((groupKey: string) => {
    // Create a safe ID by replacing invalid characters with underscores
    const safeKey = groupKey.replace(/[^a-zA-Z0-9-_]/g, "_");
    return `parent-node-${safeKey}`;
  }, []);

  const getChildNodeId = useCallback((eventIndex: number) => {
    return `child-node-${eventIndex}`;
  }, []);

  // Function to update node styles based on selectedEventId
  const updateSelectedEventStyles = useCallback(
    (newSelectedId: number | null) => {
      if (!svgRef.current) return;

      // Reset all nodes to default style
      d3.select(svgRef.current)
        .selectAll(".parent-point, .child-point-circle")
        .attr("stroke", "black");

      // If we have a selected event, highlight it
      if (newSelectedId !== null) {
        // Try to find and highlight the parent node first
        const parentNode = d3
          .select(svgRef.current)
          .select(`.parent-point[data-event-index="${newSelectedId}"]`);

        if (!parentNode.empty()) {
          // Only change color for selection
          parentNode.attr("stroke", "#3b82f6");
        }

        // Try to find and highlight the child node
        const childNode = d3
          .select(svgRef.current)
          .select(`#${getChildNodeId(newSelectedId)}`);

        if (!childNode.empty()) {
          // Highlight the child node - only change color
          childNode.attr("stroke", "#3b82f6");

          // Also highlight its parent node - only change color
          const parentKey = childNode.attr("data-parent-key");
          if (parentKey) {
            const parentNodeId = getParentNodeId(parentKey);
            d3.select(`#${parentNodeId}`)
              .select("circle")
              .attr("stroke", "#3b82f6");
          }
        }
      }
    },
    [getChildNodeId, getParentNodeId]
  );

  // Effect to handle selectedEventId changes without full re-render
  useEffect(() => {
    if (svgRef.current) {
      updateSelectedEventStyles(selectedEventId ?? null);
    }
  }, [selectedEventId, updateSelectedEventStyles]);

  // Function to update the visualization
  const updateVisualization = useCallback(() => {
    if (
      !events.length ||
      !svgRef.current ||
      !containerRef.current ||
      !headerRef.current
    )
      return;

    console.log("update whole");

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();
    d3.select(headerRef.current).selectAll("*").remove();

    // Process data points
    const dataPoints = processEvents(events);
    const topicCounts = getTopicCounts(dataPoints);
    const topTopics = getTopTopics(topicCounts);

    // Get the current container dimensions
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;

    // Calculate the usable width and height accounting for margins
    const width = Math.max(
      0,
      containerWidth - TOPIC_CONFIG.margin.left - TOPIC_CONFIG.margin.right
    );
    const height = Math.max(
      0,
      containerHeight - TOPIC_CONFIG.margin.top - TOPIC_CONFIG.margin.bottom
    );

    // Create scales with the actual available height
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

    // Create SVG with responsive dimensions
    const svg = d3
      .select(svgRef.current)
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("viewBox", `0 0 ${containerWidth} ${containerHeight}`)
      .attr("preserveAspectRatio", "xMinYMin meet")
      .style("overflow", "visible");

    // Add background rect to handle clicks outside nodes
    svg
      .append("rect")
      .attr("width", containerWidth)
      .attr("height", containerHeight)
      .attr("fill", "transparent")
      .on("click", () => {
        // Close all expanded groups when clicking on the background
        const groupedPoints = groupOverlappingPoints(
          dataPoints,
          xScale,
          yScale
        );

        groupedPoints.forEach((point) => {
          if (point.isExpanded) {
            point.isExpanded = false;
            pointStatesRef.current.set(point.key, {
              x: point.x,
              y: point.y,
              isExpanded: false,
            });

            // Find the parent node and collapse it
            const parentId = getParentNodeId(point.key);
            const parentGroup = d3.select(`#${parentId}`);

            if (!parentGroup.empty()) {
              const parentCircle = parentGroup.select("circle");
              const countText = parentGroup.select("text");
              const children = parentGroup.selectAll(".child-point");

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
    const edgesGroup = g.append("g").attr("class", "edges");

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
    const pointsGroup = g.append("g").attr("class", "points");

    // Group overlapping points
    const groupedPoints = groupOverlappingPoints(dataPoints, xScale, yScale);

    // Create parent nodes
    const parentNodes = pointsGroup
      .selectAll(".point-group")
      .data(groupedPoints)
      .enter()
      .append("g")
      .attr("class", "point-group")
      .attr("id", (d) => getParentNodeId(d.key))
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
      // Add data attributes for easy selection later
      .attr("data-group-key", (d: GroupedPoint) => {
        // Create a safe data attribute value
        return d.key.replace(/[^a-zA-Z0-9-_]/g, "_");
      })
      .attr("data-event-index", (d: GroupedPoint) => d.points[0].event.index)
      .attr("data-point-count", (d: GroupedPoint) => d.points.length)
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
      .selectAll(".child-point")
      .data((d: GroupedPoint) =>
        d.points.map((p: DataPoint, i: number) => ({
          ...p,
          parentKey: d.key.replace(/[^a-zA-Z0-9-_]/g, "_"), // Use safe key
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
      .attr("class", "child-point-circle")
      .attr("id", (d: ChildPoint) => getChildNodeId(d.event.index))
      .attr("cx", (d: ChildPoint) => {
        const parent = groupedPoints.find(
          (g) => g.key.replace(/[^a-zA-Z0-9-_]/g, "_") === d.parentKey
        )!;
        const positions = calculateExpandedPositions(
          parent,
          TOPIC_CONFIG.point.radius
        );
        return positions[d.index].x;
      })
      .attr("cy", (d: ChildPoint) => {
        const parent = groupedPoints.find(
          (g) => g.key.replace(/[^a-zA-Z0-9-_]/g, "_") === d.parentKey
        )!;
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
      .style("cursor", "pointer")
      // Add data attributes for easy selection later
      .attr("data-parent-key", (d: ChildPoint) => d.parentKey)
      .attr("data-event-index", (d: ChildPoint) => d.event.index);

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

          if (countText.node()) {
            countText.style("opacity", 0);
          }

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

          if (countText.node()) {
            countText.style("opacity", 1);
          }

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
          eventData.index === selectedEventIdRef.current
            ? null
            : eventData.index
        );
      }
    });

    // Define event handlers
    const handleNodeInteraction = {
      // Common highlight function for hover
      highlight(node: d3.Selection<any, any, any, any>, isParent: boolean) {
        // Only change size on hover, not color
        node
          .transition()
          .duration(150)
          .attr("r", TOPIC_CONFIG.point.hoverRadius);

        // If this is a child node, also highlight its parent
        if (!isParent) {
          const parentKey = node.attr("data-parent-key");
          if (parentKey) {
            const parentNodeId = getParentNodeId(parentKey);
            // Only change size on hover, not color
            d3.select(`#${parentNodeId}`)
              .select("circle")
              .transition()
              .duration(150)
              .attr("r", TOPIC_CONFIG.point.hoverRadius);
          }
        }
      },

      // Common reset function
      reset(node: d3.Selection<any, any, any, any>, d: any, isParent: boolean) {
        const pointCount = isParent && d.points ? d.points.length : 1;

        // Only reset size, not color
        node
          .transition()
          .duration(150)
          .attr(
            "r",
            isParent && pointCount > 1
              ? TOPIC_CONFIG.point.radius * 1.2
              : TOPIC_CONFIG.point.radius
          );

        // Reset parent for child nodes
        if (!isParent) {
          const parentKey = node.attr("data-parent-key");
          if (parentKey) {
            const parentNodeId = getParentNodeId(parentKey);
            const parentGroup = d3.select(`#${parentNodeId}`);

            if (!parentGroup.empty()) {
              // Only reset size, not color
              parentGroup
                .select("circle")
                .transition()
                .duration(150)
                .attr(
                  "r",
                  d.points && d.points.length > 1
                    ? TOPIC_CONFIG.point.radius * 1.2
                    : TOPIC_CONFIG.point.radius
                );
            }
          }
        }
      },

      // Mouse over handler
      mouseOver(this: any, event: MouseEvent, d: any) {
        const node = d3.select(this);
        const isParent = node.classed("parent-point");

        handleNodeInteraction.highlight(node, isParent);

        // Show tooltip
        const eventData = d.event || d.points[0].event;
        showTooltip(eventData, event.pageX, event.pageY, "topic");
      },

      // Mouse out handler
      mouseOut(this: any, event: MouseEvent, d: any) {
        const node = d3.select(this);
        const isParent = node.classed("parent-point");

        // Always reset size on mouseout, regardless of selection state
        const pointCount = isParent && d.points ? d.points.length : 1;

        // Only reset the size, not the color
        node
          .transition()
          .duration(150)
          .attr(
            "r",
            isParent && pointCount > 1
              ? TOPIC_CONFIG.point.radius * 1.2
              : TOPIC_CONFIG.point.radius
          );

        // If this is a child node, also reset its parent size
        if (!isParent) {
          const parentKey = node.attr("data-parent-key");
          if (parentKey) {
            const parentNodeId = getParentNodeId(parentKey);
            const parentGroup = d3.select(`#${parentNodeId}`);

            if (!parentGroup.empty()) {
              // Only reset size, not color
              parentGroup
                .select("circle")
                .transition()
                .duration(150)
                .attr(
                  "r",
                  d.points && d.points.length > 1
                    ? TOPIC_CONFIG.point.radius * 1.2
                    : TOPIC_CONFIG.point.radius
                );
            }
          }
        }

        // Always hide tooltip
        hideTooltip();
      },

      // Mouse move handler
      mouseMove(event: MouseEvent) {
        updatePosition(event.pageX, event.pageY);
      },

      // Child node click handler
      childClick(this: any, event: MouseEvent, d: any) {
        const eventData = d.event;
        const isDeselecting = eventData.index === selectedEventIdRef.current;

        // Hide tooltip when clicking
        hideTooltip();

        onEventSelect?.(isDeselecting ? null : eventData.index);
        event.stopPropagation();
      },
    };

    // Add event listeners to parent circles
    parentNodes
      .selectAll("circle.parent-point")
      .on("mouseover", handleNodeInteraction.mouseOver)
      .on("mouseout", handleNodeInteraction.mouseOut)
      .on("mousemove", handleNodeInteraction.mouseMove);

    // Add event listeners to child circles
    childNodes
      .selectAll("circle.child-point-circle")
      .on("mouseover", handleNodeInteraction.mouseOver)
      .on("mouseout", handleNodeInteraction.mouseOut)
      .on("mousemove", handleNodeInteraction.mouseMove)
      .on("click", handleNodeInteraction.childClick);

    // Apply initial highlighting for selected event
    if (
      selectedEventIdRef.current !== null &&
      selectedEventIdRef.current !== undefined
    ) {
      updateSelectedEventStyles(selectedEventIdRef.current);
    }
  }, [
    events,
    showTooltip,
    hideTooltip,
    updatePosition,
    onEventSelect,
    onTopicSelect,
    updateSelectedEventStyles,
    getParentNodeId,
    getChildNodeId,
  ]);

  // Initial setup and cleanup
  useEffect(() => {
    if (!containerRef.current) return;

    // Create ResizeObserver to detect both width and height changes
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === containerRef.current) {
          // Use requestAnimationFrame to throttle updates
          window.requestAnimationFrame(() => {
            // Force a complete redraw when container size changes
            updateVisualization();
          });
        }
      }
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
        className="flex-none bg-white sticky top-0 z-10 shadow-sm"
        style={{ height: `${TOPIC_CONFIG.header.height}px` }}
      />
      <div ref={containerRef} className="flex-1 relative overflow-hidden">
        <svg ref={svgRef} className="w-full h-full" />
      </div>
    </div>
  );
}
