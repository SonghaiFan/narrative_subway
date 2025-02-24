import { NarrativeEvent } from "@/types/article";
import { useCallback, useEffect, useRef, useState } from "react";

interface TooltipPosition {
  x: number;
  y: number;
}

interface TooltipProps {
  event: NarrativeEvent | null;
  position: TooltipPosition;
  visible: boolean;
  containerRef: React.RefObject<HTMLElement | null>;
}

export function NarrativeTooltip({
  event,
  position,
  visible,
  containerRef,
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
      style={{ maxWidth: "300px" }}
    >
      <div className="font-semibold text-gray-900">
        {event.topic.main_topic}
      </div>
      <div className="text-gray-700 mt-2 line-clamp-4">{event.text}</div>
      <div className="mt-2 flex items-center gap-2 text-xs">
        <span className="text-gray-600">{event.temporal_anchoring.anchor}</span>
        <span className="text-gray-400">•</span>
        <span className="text-gray-600">{event.narrative_phase}</span>
      </div>
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
