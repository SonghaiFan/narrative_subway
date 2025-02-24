"use client";

import { NarrativeEvent } from "@/types/article";
import { useMemo } from "react";

interface NarrativeTopicTextProps {
  events: NarrativeEvent[];
  selectedEventId?: string;
}

interface TopicContext {
  mainTopic: string;
  frequency: number;
  subTopics: Set<string>;
  averageSentiment: number;
  sentimentPolarity: {
    positive: number;
    negative: number;
    neutral: number;
  };
  relatedEntities: Set<string>;
  timeline: string[];
}

export function NarrativeTopicText({
  events,
  selectedEventId,
}: NarrativeTopicTextProps) {
  const topicFlow = useMemo(() => {
    // Build topic analysis
    const topicMap = new Map<string, TopicContext>();

    events.forEach((event) => {
      const mainTopic = event.topic.main_topic;
      const existingTopic = topicMap.get(mainTopic) || {
        mainTopic,
        frequency: 0,
        subTopics: new Set<string>(),
        averageSentiment: 0,
        sentimentPolarity: {
          positive: 0,
          negative: 0,
          neutral: 0,
        },
        relatedEntities: new Set<string>(),
        timeline: [],
      };

      // Update frequency
      existingTopic.frequency += 1;

      // Add sub-topics
      event.topic.sub_topic.forEach((sub) => existingTopic.subTopics.add(sub));

      // Update sentiment
      existingTopic.averageSentiment =
        (existingTopic.averageSentiment * (existingTopic.frequency - 1) +
          event.topic.sentiment.intensity) /
        existingTopic.frequency;

      // Update polarity count
      existingTopic.sentimentPolarity[event.topic.sentiment.polarity] += 1;

      // Add related entities
      event.entities.forEach((entity) =>
        existingTopic.relatedEntities.add(entity.name)
      );

      // Add to timeline
      existingTopic.timeline.push(
        event.temporal_anchoring?.real_time ||
          event.temporal_anchoring?.anchor ||
          "Unknown date"
      );

      topicMap.set(mainTopic, existingTopic);
    });

    return Array.from(topicMap.values()).sort(
      (a, b) => b.frequency - a.frequency
    );
  }, [events]);

  return (
    <div className="p-6 h-full flex flex-col overflow-auto">
      <div className="space-y-6">
        <div>
          <h3 className="font-medium mb-2">
            Topic Distribution ({topicFlow.length} unique topics)
          </h3>
          <div className="space-y-4">
            {topicFlow.map((topic) => (
              <div key={topic.mainTopic} className="bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-medium">{topic.mainTopic}</span>
                    <div className="text-sm text-gray-600 mt-1">
                      {Array.from(topic.subTopics).join(", ")}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm bg-gray-200 px-2 py-1 rounded">
                      {topic.frequency} mentions
                    </span>
                    <div className="text-xs text-gray-500 mt-1">
                      avg sentiment: {topic.averageSentiment.toFixed(2)}
                    </div>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="flex gap-2 mb-2">
                    {topic.sentimentPolarity.positive > 0 && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                        +{topic.sentimentPolarity.positive}
                      </span>
                    )}
                    {topic.sentimentPolarity.negative > 0 && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                        -{topic.sentimentPolarity.negative}
                      </span>
                    )}
                    {topic.sentimentPolarity.neutral > 0 && (
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                        ={topic.sentimentPolarity.neutral}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-600">
                    Key entities:{" "}
                    {Array.from(topic.relatedEntities).slice(0, 3).join(", ")}
                    {topic.relatedEntities.size > 3 &&
                      ` +${topic.relatedEntities.size - 3} more`}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Timeline: {topic.timeline.join(" → ")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
