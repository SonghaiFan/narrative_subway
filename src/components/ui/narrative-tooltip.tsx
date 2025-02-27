import { Entity, NarrativeEvent } from "@/types/article";
import { useCallback, useEffect, useRef, useState } from "react";

interface TooltipPosition {
  x: number;
  y: number;
}

type VisualizationType = "entity" | "time" | "topic";

interface TooltipProps {
  event: NarrativeEvent | null;
  position: TooltipPosition;
  visible: boolean;
  containerRef: React.RefObject<HTMLElement | null>;
  type?: VisualizationType;
}

function EntityTooltipContent({ event }: { event: NarrativeEvent }) {
  return (
    <>
      <div className="font-semibold text-gray-900 mb-2">{event.short_text}</div>
      <div className="space-y-2">
        <div className="text-sm text-gray-700 mb-2 border-b border-gray-100 pb-2">
          {event.text}
        </div>
        <div className="text-sm text-gray-700">
          <span className="text-gray-500">Phase:</span> {event.narrative_phase}
        </div>
        <div className="text-sm">
          <span className="text-gray-500">Entities:</span>
          <div className="mt-1 flex flex-wrap gap-1">
            {event.entities.map((entity: Entity) => (
              <span
                key={entity.id}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs"
              >
                {entity.name}
                <span className="ml-1 text-[10px] opacity-75">
                  ({entity.social_role})
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function TimeTooltipContent({ event }: { event: NarrativeEvent }) {
  return (
    <>
      <div className="font-semibold text-gray-900 mb-2">{event.short_text}</div>
      <div className="space-y-2">
        <div className="text-sm text-gray-700 mb-2 border-b border-gray-100 pb-2">
          {event.text}
        </div>
        <div className="text-sm text-gray-700">
          <span className="text-gray-500">Time:</span>{" "}
          {event.temporal_anchoring.real_time ||
            event.temporal_anchoring.anchor}
        </div>
        {event.lead_title && (
          <div className="text-sm text-gray-700">
            <span className="text-gray-500">Section:</span> {event.lead_title}
          </div>
        )}
        <div className="text-sm text-gray-700">
          <span className="text-gray-500">Source:</span>{" "}
          {event.source_name || "Not specified"}
        </div>
      </div>
    </>
  );
}

function TopicTooltipContent({ event }: { event: NarrativeEvent }) {
  return (
    <>
      <div className="font-semibold text-gray-900 mb-2">{event.short_text}</div>
      <div className="space-y-2">
        <div className="text-sm text-gray-700 mb-2 border-b border-gray-100 pb-2">
          {event.text}
        </div>
        <div className="text-sm text-gray-700">
          <span className="text-gray-500">Main Topic:</span>{" "}
          {event.topic.main_topic}
        </div>
        {event.topic.sub_topic.length > 0 && (
          <div className="text-sm">
            <span className="text-gray-500">Sub-topics:</span>
            <div className="mt-1 flex flex-wrap gap-1">
              {event.topic.sub_topic.map((topic) => (
                <span
                  key={topic}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}
        <div className="text-sm text-gray-700">
          <span className="text-gray-500">Sentiment:</span>{" "}
          <span
            className={`${
              event.topic.sentiment.polarity === "positive"
                ? "text-green-600"
                : event.topic.sentiment.polarity === "negative"
                ? "text-red-600"
                : "text-gray-600"
            }`}
          >
            {event.topic.sentiment.polarity} (
            {Math.round(event.topic.sentiment.intensity * 100)}%)
          </span>
        </div>
      </div>
    </>
  );
}

export function NarrativeTooltip({
  event,
  position,
  visible,
  containerRef,
  type = "topic",
}: TooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    if (!tooltipRef.current || !containerRef.current) return;

    const tooltipEl = tooltipRef.current;
    const containerBounds = containerRef.current.getBoundingClientRect();
    const tooltipBounds = tooltipEl.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = position.x + 10;
    let top = position.y + 10;

    // Adjust horizontal position if needed
    if (left + tooltipBounds.width > viewportWidth - 10) {
      left = position.x - tooltipBounds.width - 10;
    }

    // Adjust vertical position if needed
    if (top + tooltipBounds.height > viewportHeight - 10) {
      top = position.y - tooltipBounds.height - 10;
    }

    tooltipEl.style.left = `${left}px`;
    tooltipEl.style.top = `${top}px`;
  }, [position, containerRef]);

  useEffect(() => {
    if (visible) {
      updatePosition();
    }
  }, [visible, updatePosition]);

  if (!visible || !event) return null;

  return (
    <div
      ref={tooltipRef}
      className="fixed bg-white p-4 rounded-lg shadow-lg text-sm z-50 pointer-events-none border border-gray-200"
      style={{ maxWidth: "320px" }}
    >
      {type === "entity" && <EntityTooltipContent event={event} />}
      {type === "time" && <TimeTooltipContent event={event} />}
      {type === "topic" && <TopicTooltipContent event={event} />}
    </div>
  );
}

// Helper hook for managing tooltip state
export function useNarrativeTooltip() {
  const [tooltipState, setTooltipState] = useState<{
    event: NarrativeEvent | null;
    position: TooltipPosition;
    visible: boolean;
  }>({
    event: null,
    position: { x: 0, y: 0 },
    visible: false,
  });

  const showTooltip = useCallback(
    (event: NarrativeEvent, x: number, y: number) => {
      setTooltipState({
        event,
        position: { x, y },
        visible: true,
      });
    },
    []
  );

  const hideTooltip = useCallback(() => {
    setTooltipState((prev) => ({ ...prev, visible: false }));
  }, []);

  const updatePosition = useCallback((x: number, y: number) => {
    setTooltipState((prev) => ({
      ...prev,
      position: { x, y },
    }));
  }, []);

  return {
    tooltipState,
    showTooltip,
    hideTooltip,
    updatePosition,
  };
}
