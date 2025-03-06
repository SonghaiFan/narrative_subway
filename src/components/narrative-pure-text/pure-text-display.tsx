"use client";

import { NarrativeEvent } from "@/types/article";
import { useMemo } from "react";
import { PURE_TEXT_CONFIG } from "./pure-text-config";
import { useCenterControl } from "@/lib/center-control-context";
import { SHARED_CONFIG } from "../shared/visualization-config";

interface PureTextDisplayProps {
  events: NarrativeEvent[];
}

export function PureTextDisplay({ events }: PureTextDisplayProps) {
  const { selectedEventId, setSelectedEventId } = useCenterControl();

  // Sort events by narrative time
  const sortedEvents = useMemo(() => {
    return [...events].sort(
      (a, b) =>
        a.temporal_anchoring.narrative_time -
        b.temporal_anchoring.narrative_time
    );
  }, [events]);

  if (!events.length) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <p className="text-gray-500">No narrative events available</p>
      </div>
    );
  }

  const { text } = PURE_TEXT_CONFIG;

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Header - sticky within parent container */}
      <div
        className="flex-none flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white"
        style={{ height: `${SHARED_CONFIG.header.height}px` }}
      >
        <div className="flex items-center gap-4 overflow-hidden">
          <h2 className="text-sm font-medium text-gray-600">
            Narrative Events
          </h2>
          <span className="text-xs text-gray-500">
            {events.length} event{events.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Content - scrollable area */}
      <div className="flex-1 min-h-0 overflow-auto">
        <div className="p-3 sm:p-4 md:p-6 lg:p-8 flex justify-center">
          <div className="w-full max-w-3xl">
            <div className="space-y-3 sm:space-y-4">
              {sortedEvents.map((event) => (
                <div
                  key={event.index}
                  className={`group p-3 sm:p-4 rounded-md transition-colors cursor-pointer ${
                    selectedEventId === event.index
                      ? "bg-blue-50 border border-blue-200"
                      : "bg-white hover:bg-gray-50 border border-gray-200"
                  }`}
                  style={{
                    marginBottom: `${text.cardSpacing}px`,
                    padding: `${text.cardPadding}px`,
                  }}
                  onClick={() =>
                    setSelectedEventId(
                      event.index === selectedEventId ? null : event.index
                    )
                  }
                >
                  <div className="flex items-start justify-between gap-4">
                    <p
                      className="text-gray-900 flex-1"
                      style={{ fontSize: `${text.fontSize.content}px` }}
                    >
                      {event.text}
                    </p>
                    <div
                      className="flex-shrink-0 text-gray-500"
                      style={{ fontSize: `${text.fontSize.meta}px` }}
                    >
                      #{event.index}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3">
                    <span
                      className="px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${text.colors.mainTopic}20`,
                        color: text.colors.mainTopic,
                        fontSize: `${text.fontSize.meta}px`,
                      }}
                    >
                      {event.topic.main_topic}
                    </span>
                    {event.topic.sub_topic.map((subTopic) => (
                      <span
                        key={subTopic}
                        className="px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${text.colors.subTopic}15`,
                          color: text.colors.subTopic,
                          fontSize: `${text.fontSize.meta}px`,
                        }}
                      >
                        {subTopic}
                      </span>
                    ))}
                  </div>

                  <div
                    className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-3 pt-2 border-t border-gray-100 text-gray-500"
                    style={{ fontSize: `${text.fontSize.meta}px` }}
                  >
                    <div className="mb-1 sm:mb-0 flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        style={{
                          width: `${text.iconSize}px`,
                          height: `${text.iconSize}px`,
                        }}
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Narrative time: {event.temporal_anchoring.narrative_time}
                    </div>
                    {event.temporal_anchoring.real_time && (
                      <div className="flex items-center gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          style={{
                            width: `${text.iconSize}px`,
                            height: `${text.iconSize}px`,
                          }}
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z"
                            clipRule="evenodd"
                          />
                        </svg>
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
      </div>
    </div>
  );
}
