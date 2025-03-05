import { NarrativeEvent } from "@/types/article";
import { useState } from "react";

interface TimeTextProps {
  events: NarrativeEvent[];
  selectedEventId?: number | null;
  onEventSelect?: (id: number | null) => void;
}

export function NarrativeTimeText({ events, selectedEventId }: TimeTextProps) {
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const [showAllEvents, setShowAllEvents] = useState(false);

  // Sort events by narrative time
  const sortedEvents = [...events].sort(
    (a, b) =>
      a.temporal_anchoring.narrative_time - b.temporal_anchoring.narrative_time
  );

  const toggleEvent = (eventId: string) => {
    setExpandedEvents((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  };

  return (
    <div className="w-full h-full overflow-auto">
      <div className="p-4 space-y-6">
        <div>
          <h3 className="font-medium mb-2">
            Narrative Timeline ({events.length} events)
          </h3>
          <div className="space-y-4">
            {(showAllEvents ? sortedEvents : sortedEvents.slice(0, 10)).map(
              (event) => (
                <div
                  key={event.index}
                  className={`bg-gray-50 p-3 rounded-lg ${
                    selectedEventId === event.index
                      ? "ring-2 ring-blue-500"
                      : ""
                  }`}
                >
                  <div
                    className="flex justify-between items-start mb-2 cursor-pointer"
                    onClick={() => toggleEvent(String(event.index))}
                  >
                    <div className="flex items-center gap-2">
                      <button
                        className="w-5 h-5 rounded border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleEvent(String(event.index));
                        }}
                      >
                        {expandedEvents.has(String(event.index)) ? "−" : "+"}
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            Event {event.temporal_anchoring.narrative_time}
                          </span>
                          {event.temporal_anchoring.real_time && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                              {new Date(
                                event.temporal_anchoring.real_time
                              ).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          {event.temporal_anchoring.temporal_type} •{" "}
                          {event.temporal_anchoring.anchor}
                        </div>
                      </div>
                    </div>
                  </div>
                  {expandedEvents.has(String(event.index)) && (
                    <div className="space-y-2 mt-3">
                      <div className="text-sm bg-white p-2 rounded border border-gray-100">
                        <p className="text-gray-700">{event.text}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                            {event.topic.main_topic}
                          </span>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                            {event.narrative_level}
                          </span>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                            {event.narrator_type}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            )}
          </div>
          {sortedEvents.length > 10 && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => setShowAllEvents(!showAllEvents)}
                className="group relative inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
              >
                {showAllEvents ? (
                  <>
                    Show Less
                    <svg
                      className="w-4 h-4 transition-transform group-hover:-translate-y-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 15l7-7 7 7"
                      />
                    </svg>
                  </>
                ) : (
                  <>
                    Show {sortedEvents.length - 10} More Events
                    <svg
                      className="w-4 h-4 transition-transform group-hover:translate-y-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
