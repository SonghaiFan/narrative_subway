"use client";

import { NarrativeEvent } from "@/types/article";
import { useMemo } from "react";

interface PureTextDisplayProps {
  events: NarrativeEvent[];
  selectedEventId?: number | null;
  onEventSelect?: (id: number | null) => void;
}

export function PureTextDisplay({
  events,
  selectedEventId,
  onEventSelect,
}: PureTextDisplayProps) {
  // Sort events by narrative time
  const sortedEvents = useMemo(() => {
    return [...events].sort(
      (a, b) =>
        a.temporal_anchoring.narrative_time -
        b.temporal_anchoring.narrative_time
    );
  }, [events]);

  return (
    <div className="p-6 h-full overflow-auto">
      <div className="prose prose-sm max-w-none">
        <h2 className="text-xl font-semibold mb-4">Narrative</h2>
        <div className="space-y-4">
          {sortedEvents.map((event) => (
            <div
              key={event.index}
              className={`p-4 rounded-md transition-colors ${
                selectedEventId === event.index
                  ? "bg-blue-50 border border-blue-200"
                  : "bg-gray-50 hover:bg-gray-100 border border-gray-200"
              }`}
              onClick={() =>
                onEventSelect?.(
                  event.index === selectedEventId ? null : event.index
                )
              }
            >
              <p className="text-base mb-2">{event.text}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                  {event.topic.main_topic}
                </span>
                {event.topic.sub_topic.map((subTopic) => (
                  <span
                    key={subTopic}
                    className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full"
                  >
                    {subTopic}
                  </span>
                ))}
              </div>
              <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                <div>
                  Narrative time: {event.temporal_anchoring.narrative_time}
                </div>
                {event.temporal_anchoring.real_time && (
                  <div>
                    {new Date(
                      event.temporal_anchoring.real_time
                    ).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
