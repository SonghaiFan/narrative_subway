"use client";

import { NarrativeEvent } from "@/types/article";
import { useEffect, useMemo, useRef } from "react";
import cytoscape from "cytoscape";
import dagre from "cytoscape-dagre";
import {
  NarrativeTooltip,
  useNarrativeTooltip,
} from "../shared/narrative-tooltip";

// Register the dagre layout
cytoscape.use(dagre);

interface NarrativeTopicVisualProps {
  events: NarrativeEvent[];
  selectedEventId?: string;
}

function generateEventId(event: NarrativeEvent, index: number): string {
  const timestamp =
    event.temporal_anchoring?.real_time ||
    event.temporal_anchoring?.anchor ||
    "unknown";
  const baseId = `${event.topic.main_topic}-${timestamp}`.replace(
    /[^a-zA-Z0-9-]/g,
    "-"
  );
  return `${baseId}-${index}`;
}

function getSentimentColor(sentiment: number): {
  bg: string;
  border: string;
  text: string;
} {
  if (sentiment > 0) {
    return { bg: "#ffffff", border: "#000000", text: "#000000" };
  } else if (sentiment < 0) {
    return { bg: "#f3f3f3", border: "#666666", text: "#000000" };
  }
  return { bg: "#ffffff", border: "#999999", text: "#000000" };
}

export function NarrativeTopicVisual({
  events,
  selectedEventId,
}: NarrativeTopicVisualProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { tooltipState, showTooltip, hideTooltip, updatePosition } =
    useNarrativeTooltip();

  // Process data for DAG
  const { nodes, edges } = useMemo(() => {
    // Sort events by timestamp
    const sortedEvents = [...events].sort((a, b) => {
      const timeA =
        a.temporal_anchoring?.real_time || a.temporal_anchoring?.anchor || "";
      const timeB =
        b.temporal_anchoring?.real_time || b.temporal_anchoring?.anchor || "";
      return timeA.localeCompare(timeB);
    });

    const nodes: cytoscape.NodeDefinition[] = [];
    const edges: cytoscape.EdgeDefinition[] = [];
    const nodeMap = new Map<string, NarrativeEvent>();
    const topicTimestampMap = new Map<string, Map<string, string>>();
    const idCounterMap = new Map<string, number>();
    const connectedNodes = new Set<string>();

    // First pass: Create all nodes
    sortedEvents.forEach((event, idx) => {
      const timestamp =
        event.temporal_anchoring?.real_time ||
        event.temporal_anchoring?.anchor ||
        "Unknown";
      const baseKey = `${event.topic.main_topic}-${timestamp}`;
      const counter = (idCounterMap.get(baseKey) || 0) + 1;
      idCounterMap.set(baseKey, counter);

      const id = generateEventId(event, counter);
      nodeMap.set(id, event);

      // Track nodes by topic and timestamp for linking
      if (!topicTimestampMap.has(event.topic.main_topic)) {
        topicTimestampMap.set(event.topic.main_topic, new Map());
      }
      topicTimestampMap.get(event.topic.main_topic)!.set(timestamp, id);
    });

    // Second pass: Create edges and track connected nodes
    sortedEvents.forEach((event, idx) => {
      if (idx === 0) {
        // Always include the first node
        const id = generateEventId(event, 1);
        connectedNodes.add(id);
      } else {
        const timestamp =
          event.temporal_anchoring?.real_time ||
          event.temporal_anchoring?.anchor ||
          "Unknown";
        const baseKey = `${event.topic.main_topic}-${timestamp}`;
        const counter = idCounterMap.get(baseKey) || 1;
        const currentId = generateEventId(event, counter);

        const topicNodes = topicTimestampMap.get(event.topic.main_topic)!;
        const timestamps = Array.from(topicNodes.keys()).sort();
        const currentTimestampIdx = timestamps.indexOf(timestamp);

        let isConnected = false;

        // Link to previous nodes in the same topic
        if (currentTimestampIdx > 0) {
          const prevTimestamp = timestamps[currentTimestampIdx - 1];
          const prevId = topicNodes.get(prevTimestamp)!;
          edges.push({
            data: {
              id: `${prevId}-${currentId}`,
              source: prevId,
              target: currentId,
              weight: 1,
              type: "same-topic",
            },
          });
          connectedNodes.add(prevId);
          connectedNodes.add(currentId);
          isConnected = true;
        }

        // Create cross-topic links
        const prevEvent = sortedEvents[idx - 1];
        const sharedSubtopics = event.topic.sub_topic.filter((st) =>
          prevEvent.topic.sub_topic.includes(st)
        );

        if (
          sharedSubtopics.length > 0 &&
          prevEvent.topic.main_topic !== event.topic.main_topic
        ) {
          const prevTimestamp =
            prevEvent.temporal_anchoring?.real_time ||
            prevEvent.temporal_anchoring?.anchor ||
            "Unknown";
          const prevBaseKey = `${prevEvent.topic.main_topic}-${prevTimestamp}`;
          const prevCounter = idCounterMap.get(prevBaseKey) || 1;
          const prevId = generateEventId(prevEvent, prevCounter);

          edges.push({
            data: {
              id: `${prevId}-${currentId}-cross`,
              source: prevId,
              target: currentId,
              weight: sharedSubtopics.length,
              type: "cross-topic",
              sharedTopics: sharedSubtopics,
            },
          });
          connectedNodes.add(prevId);
          connectedNodes.add(currentId);
          isConnected = true;
        }
      }
    });

    // Only create nodes for connected events
    Array.from(nodeMap.entries()).forEach(([id, event]) => {
      if (connectedNodes.has(id) || id === selectedEventId) {
        const colors = getSentimentColor(event.topic.sentiment.intensity);
        nodes.push({
          data: {
            id,
            mainTopic: event.topic.main_topic,
            subTopics: event.topic.sub_topic,
            timestamp:
              event.temporal_anchoring?.real_time ||
              event.temporal_anchoring?.anchor ||
              "Unknown",
            sentiment: event.topic.sentiment.intensity,
            selected: id === selectedEventId,
            bgColor: colors.bg,
            borderColor: colors.border,
            textColor: colors.text,
            text: event.text,
            event: event,
          },
        });
      }
    });

    return { nodes, edges };
  }, [events, selectedEventId]);

  useEffect(() => {
    if (!containerRef.current) return;

    const cy = cytoscape({
      container: containerRef.current,
      elements: {
        nodes,
        edges,
      },
      style: [
        {
          selector: "node",
          style: {
            "background-color": "data(bgColor)",
            "border-color": "data(borderColor)",
            "border-width": 1,
            width: 100,
            height: 40,
            shape: "round-rectangle",
            label: (ele) => {
              const topic = ele.data("mainTopic");
              const text = ele.data("text");
              // Truncate text to ~50 chars
              const truncatedText =
                text.length > 50 ? text.slice(0, 47) + "..." : text;
              return `${topic}\n${truncatedText}`;
            },
            "text-valign": "center",
            "text-halign": "center",
            "text-wrap": "wrap",
            "text-max-width": "90px",
            "font-size": "7px",
            "text-overflow-wrap": "anywhere",
            "text-justification": "center",
            "text-margin-y": 3,
            "line-height": 1.2,
            color: "data(textColor)",
            "overlay-padding": "4px",
            "overlay-opacity": 0,
            "transition-property":
              "background-color, border-color, border-width",
            "transition-duration": 150,
          },
        },
        {
          selector: "node.highlight",
          style: {
            "border-width": 1.5,
            "border-color": "#000000",
            "background-color": "#ffffff",
            "z-index": 999,
          },
        },
        {
          selector: "node.faded",
          style: {
            opacity: 0.3,
          },
        },
        {
          selector: "edge",
          style: {
            "curve-style": "bezier",
            "target-arrow-shape": "triangle",
            "arrow-scale": 0.5,
            width: 1,
            "line-color": "#666666",
            "target-arrow-color": "#666666",
            opacity: 0.8,
            "transition-property": "opacity, line-color, target-arrow-color",
            "transition-duration": 200,
          },
        },
        {
          selector: "edge.highlight",
          style: {
            "line-color": "#000000",
            "target-arrow-color": "#000000",
            opacity: 1,
            width: 1.5,
            "z-index": 999,
          },
        },
        {
          selector: "edge.faded",
          style: {
            opacity: 0.1,
          },
        },
        {
          selector: "edge[type='cross-topic']",
          style: {
            "line-style": "dashed",
            "line-dash-pattern": [4, 4],
            "line-color": "#999999",
            "target-arrow-color": "#999999",
            opacity: 0.6,
          },
        },
      ],
      layout: {
        name: "dagre",
        rankDir: "LR" as const,
        align: "UL" as const,
        ranker: "longest-path" as const,
        nodeSep: 50,
        rankSep: 100,
        edgeSep: 20,
        marginX: 40,
        marginY: 20,
        animate: true,
        animationDuration: 300,
        fit: true,
        padding: { top: 20, bottom: 20, left: 30, right: 30 },
        spacingFactor: 1.5,
        acyclicer: "greedy" as const,
      },
      wheelSensitivity: 0.2,
      minZoom: 0.2,
      maxZoom: 2.5,
      maxBounds: [
        {
          x1: 0,
          y1: 0,
          x2: 10000,
          y2: 10000,
        },
      ],
      panningEnabled: true,
      userPanningEnabled: true,
      userZoomingEnabled: true,
      boxSelectionEnabled: false,
    });

    // Save reference immediately
    cyRef.current = cy;

    // Function to handle layout and fit
    const handleResize = () => {
      if (!cyRef.current) return;

      // Clear any pending timeout
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }

      // Delay layout to avoid multiple rapid calls
      resizeTimeoutRef.current = setTimeout(() => {
        if (!cyRef.current) return;

        const layout = cyRef.current.layout({
          name: "dagre",
          rankDir: "LR" as const,
          align: "UL" as const,
          ranker: "longest-path" as const,
          nodeSep: 50,
          rankSep: 100,
          animate: true,
          animationDuration: 300,
          fit: true,
          padding: { top: 20, bottom: 20, left: 30, right: 30 },
        });

        layout.run();

        // Additional delay for fit and center
        setTimeout(() => {
          if (!cyRef.current) return;
          cyRef.current.fit();
          cyRef.current.center();
        }, 310);
      }, 250);
    };

    // Set up ResizeObserver
    resizeObserverRef.current = new ResizeObserver(handleResize);

    if (containerRef.current) {
      resizeObserverRef.current.observe(containerRef.current);
    }

    // Initialize layout
    cy.ready(handleResize);

    // Add hover effect
    cy.on("mouseover", "node", (evt) => {
      const node = evt.target;

      // Highlight the node and its neighborhood
      const neighborhood = node.neighborhood().add(node);
      const others = cy.elements().not(neighborhood);

      neighborhood.addClass("highlight");
      others.addClass("faded");

      // Show tooltip with additional info
      const data = node.data();
      const event = data.event;
      if (!event) return;

      showTooltip(event, evt.originalEvent.clientX, evt.originalEvent.clientY);

      cy.on("mousemove", (e) => {
        updatePosition(e.originalEvent.clientX, e.originalEvent.clientY);
      });

      node.once("mouseout", () => {
        hideTooltip();
        if (!node.data("selected")) {
          node.style({
            "border-width": 1,
            "border-opacity": 1,
            "background-opacity": 1,
            "z-index": "auto",
          });
        }
      });
    });

    cy.on("mouseout", "node", (evt) => {
      const node = evt.target;

      // Remove highlights
      cy.elements().removeClass("highlight faded");
      hideTooltip();
    });

    return () => {
      // Clear any pending timeouts
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      // Disconnect observer
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      // Destroy cytoscape instance
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, [nodes, edges, events]);

  return (
    <>
      <div ref={containerRef} className="w-full h-full" />
      <NarrativeTooltip
        event={tooltipState.event}
        position={tooltipState.position}
        visible={tooltipState.visible}
        containerRef={containerRef}
      />
    </>
  );
}
