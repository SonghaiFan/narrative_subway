"use client";

import { TimelineEvent } from "@/types/article";
import { useMemo } from "react";

interface NarrativeTopicTextProps {
  events: TimelineEvent[];
  selectedEventId?: string;
}

interface TopicNode {
  id: string;
  mainTopic: string;
  subTopics: string[];
  timestamp: string;
  sentiment: number;
}

function generateEventId(event: TimelineEvent): string {
  // Create a unique ID based on topic and timestamp
  const timestamp =
    event.temporal_anchoring?.real_time ||
    event.temporal_anchoring?.anchor ||
    "unknown";
  return `${event.topic.main_topic}-${timestamp}`.replace(
    /[^a-zA-Z0-9-]/g,
    "-"
  );
}

export function NarrativeTopicText({
  events,
  selectedEventId,
}: NarrativeTopicTextProps) {
  const topicFlow = useMemo(() => {
    // Sort events by timestamp
    const sortedEvents = [...events].sort((a, b) => {
      const timeA =
        a.temporal_anchoring?.real_time || a.temporal_anchoring?.anchor || "";
      const timeB =
        b.temporal_anchoring?.real_time || b.temporal_anchoring?.anchor || "";
      return timeA.localeCompare(timeB);
    });

    // Group events by main topic
    const topicGroups = new Map<string, TopicNode[]>();

    sortedEvents.forEach((event) => {
      const mainTopic = event.topic.main_topic;
      const node: TopicNode = {
        id: generateEventId(event),
        mainTopic,
        subTopics: event.topic.sub_topic,
        timestamp:
          event.temporal_anchoring?.real_time ||
          event.temporal_anchoring?.anchor ||
          "Unknown",
        sentiment: event.topic.sentiment.intensity,
      };

      if (!topicGroups.has(mainTopic)) {
        topicGroups.set(mainTopic, []);
      }
      topicGroups.get(mainTopic)!.push(node);
    });

    return Array.from(topicGroups.entries()).sort(
      (a, b) => b[1].length - a[1].length
    ); // Sort by frequency
  }, [events]);

  return (
    <div className="p-4 space-y-6">
      {topicFlow.map(([topic, nodes]) => (
        <div key={topic} className="border-l-4 border-gray-200 pl-4">
          <h3 className="font-medium text-lg mb-2">{topic}</h3>
          <div className="space-y-3">
            {nodes.map((node, idx) => (
              <div
                key={node.id}
                className={`p-3 rounded-lg ${
                  selectedEventId === node.id
                    ? "bg-blue-50 border border-blue-200"
                    : "bg-gray-50"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-sm text-gray-600">
                      {node.subTopics.join(", ")}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {node.timestamp}
                    </div>
                  </div>
                  <div className="text-sm">
                    <span
                      className={`px-2 py-1 rounded ${
                        node.sentiment > 0
                          ? "bg-green-100 text-green-700"
                          : node.sentiment < 0
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {node.sentiment.toFixed(2)}
                    </span>
                  </div>
                </div>
                {idx < nodes.length - 1 && (
                  <div className="h-4 border-l border-dashed border-gray-300 ml-2 my-1" />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
