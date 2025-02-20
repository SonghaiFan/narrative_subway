import { TimelineEvent } from "@/types/article";

interface DetailedContentProps {
  events: TimelineEvent[];
  selectedEventId?: string;
}

export function NarrativeCurve({
  events,
  selectedEventId,
}: DetailedContentProps) {
  // Sort events by narrative time
  const sortedEvents = [...events].sort(
    (a, b) =>
      a.temporal_anchoring.narrative_time - b.temporal_anchoring.narrative_time
  );

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">Narrative Time Analysis</h2>
      <div className="space-y-4">
        {sortedEvents.map((event) => (
          <div
            key={event.index}
            className={`bg-white rounded-lg border p-4 ${
              selectedEventId === String(event.index)
                ? "border-blue-500 ring-2 ring-blue-200"
                : "border-gray-200"
            }`}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                    Narrative Time: {event.temporal_anchoring.narrative_time}
                  </span>
                  {event.temporal_anchoring.real_time && (
                    <span className="text-sm font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded">
                      Real Time: {event.temporal_anchoring.real_time}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {event.temporal_anchoring.temporal_type === "absolute" ? (
                    <span className="inline-flex items-center">
                      <span className="w-2 h-2 bg-blue-400 rounded-full mr-1" />
                      Absolute Time
                    </span>
                  ) : (
                    <span className="inline-flex items-center">
                      <span className="w-2 h-2 bg-amber-400 rounded-full mr-1" />
                      Relative Time: {event.temporal_anchoring.anchor}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-xs text-gray-500">
                {event.narrative_level} • {event.narrator_type}
              </span>
            </div>

            <p className="text-gray-700 mb-2">{event.text}</p>

            <div className="flex flex-wrap gap-2 mt-2">
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                Phase: {event.narrative_phase}
              </span>
              {event.source_name && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                  Source: {event.source_name}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
