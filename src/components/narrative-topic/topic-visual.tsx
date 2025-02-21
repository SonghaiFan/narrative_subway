"use client";

import { TimelineEvent } from "@/types/article";
import { useEffect, useMemo, useRef } from "react";
import cytoscape from "cytoscape";
import dagre from "cytoscape-dagre";

// Register the dagre layout
cytoscape.use(dagre);

interface NarrativeTopicVisualProps {
  events: TimelineEvent[];
  selectedEventId?: string;
}

function generateEventId(event: TimelineEvent, index: number): string {
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
    return { bg: "#dcfce7", border: "#86efac", text: "#166534" };
  } else if (sentiment < 0) {
    return { bg: "#fee2e2", border: "#fca5a5", text: "#991b1b" };
  }
  return { bg: "#f3f4f6", border: "#d1d5db", text: "#374151" };
}

export function NarrativeTopicVisual({
  events,
  selectedEventId,
}: NarrativeTopicVisualProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);

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
    const nodeMap = new Map<string, TimelineEvent>();
    const topicTimestampMap = new Map<string, Map<string, string>>();
    const idCounterMap = new Map<string, number>();

    // Create nodes
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
      const colors = getSentimentColor(event.topic.sentiment.intensity);

      nodes.push({
        data: {
          id,
          mainTopic: event.topic.main_topic,
          subTopics: event.topic.sub_topic,
          timestamp,
          sentiment: event.topic.sentiment.intensity,
          selected: id === selectedEventId,
          bgColor: colors.bg,
          borderColor: colors.border,
          textColor: colors.text,
        },
      });

      // Track nodes by topic and timestamp for linking
      if (!topicTimestampMap.has(event.topic.main_topic)) {
        topicTimestampMap.set(event.topic.main_topic, new Map());
      }
      topicTimestampMap.get(event.topic.main_topic)!.set(timestamp, id);
    });

    // Create edges based on topic and temporal relationships
    sortedEvents.forEach((event, idx) => {
      if (idx === 0) return;

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
      }

      // Create cross-topic links based on shared subtopics
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
      }
    });

    return { nodes, edges };
  }, [events, selectedEventId]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Cytoscape
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
            "border-width": 2,
            width: 80,
            height: 40,
            shape: "round-rectangle",
            "text-wrap": "wrap",
            "text-max-width": 70,
            "text-valign": "center",
            "text-halign": "center",
            "font-size": 10,
            color: "data(textColor)",
            "text-margin-y": -5,
            label: "data(mainTopic)",
            "overlay-padding": "6px",
            "overlay-opacity": 0,
          },
        },
        {
          selector: "node[selected]",
          style: {
            "border-width": 3,
            "border-color": "#3b82f6",
            "border-opacity": 0.8,
            "background-opacity": 0.9,
          },
        },
        {
          selector: "edge",
          style: {
            "curve-style": "bezier",
            "target-arrow-shape": "triangle",
            "arrow-scale": 0.8,
            width: 1.5,
            "line-color": "#cbd5e1",
            "target-arrow-color": "#cbd5e1",
            opacity: 0.6,
          },
        },
        {
          selector: "edge[type='cross-topic']",
          style: {
            "line-style": "dashed",
            "line-dash-pattern": [6, 3],
            "line-color": "#94a3b8",
            "target-arrow-color": "#94a3b8",
            opacity: 0.4,
          },
        },
      ],
      layout: {
        name: "dagre",
        rankDir: "LR",
        nodeSep: 50,
        rankSep: 80,
        edgeSep: 20,
        ranker: "network-simplex",
        animate: true,
        animationDuration: 300,
        fit: true,
        padding: 30,
      },
      wheelSensitivity: 0.2,
      minZoom: 0.2,
      maxZoom: 2.5,
    });

    // Save reference for cleanup
    cyRef.current = cy;

    // Add hover effect
    cy.on("mouseover", "node", (evt) => {
      const node = evt.target;
      node.style({
        "border-width": 3,
        "border-opacity": 1,
        "background-opacity": 1,
        "z-index": 999,
      });

      // Show tooltip with additional info
      const data = node.data();
      const tooltip = document.createElement("div");
      tooltip.className =
        "fixed bg-white p-2 rounded-lg shadow-lg text-xs z-50 pointer-events-none";
      tooltip.style.maxWidth = "200px";
      tooltip.innerHTML = `
        <div class="font-medium">${data.mainTopic}</div>
        <div class="text-gray-600 mt-1">${data.subTopics.join(", ")}</div>
        <div class="text-gray-500 mt-1">${data.timestamp}</div>
        <div class="mt-1">Sentiment: ${data.sentiment.toFixed(2)}</div>
      `;
      document.body.appendChild(tooltip);

      cy.on("mousemove", (e) => {
        const containerBounds = containerRef.current!.getBoundingClientRect();
        tooltip.style.left = `${e.originalEvent.clientX + 10}px`;
        tooltip.style.top = `${e.originalEvent.clientY + 10}px`;
      });

      node.once("mouseout", () => {
        tooltip.remove();
        if (!node.data("selected")) {
          node.style({
            "border-width": 2,
            "border-opacity": 1,
            "background-opacity": 1,
            "z-index": "auto",
          });
        }
      });
    });

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, [nodes, edges]);

  return <div ref={containerRef} className="w-full h-full" />;
}
