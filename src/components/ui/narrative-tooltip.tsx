"use client";

import { Entity, NarrativeEvent } from "@/types/article";
import { useEffect, useRef, useState } from "react";
import { formatDate } from "@/lib/utils";
import { TooltipPosition, VisualizationType } from "@/lib/tooltip-context";

interface NarrativeTooltipProps {
  event: NarrativeEvent | null;
  position: TooltipPosition | null;
  visible: boolean;
  type: VisualizationType;
}

export function NarrativeTooltip({
  event,
  position,
  visible,
  type,
}: NarrativeTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipStyle, setTooltipStyle] = useState({
    left: "0px",
    top: "0px",
    opacity: 0,
    pointerEvents: "none" as const,
  });

  useEffect(() => {
    if (!tooltipRef.current || !position || !visible) {
      setTooltipStyle((prev) => ({ ...prev, opacity: 0 }));
      return;
    }

    const tooltipWidth = tooltipRef.current.offsetWidth;
    const tooltipHeight = tooltipRef.current.offsetHeight;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Calculate position to ensure tooltip stays within viewport
    let left = position.x + 10;
    let top = position.y + 10;

    // Adjust horizontal position if needed
    if (left + tooltipWidth > viewportWidth - 20) {
      left = position.x - tooltipWidth - 10;
    }

    // Adjust vertical position if needed
    if (top + tooltipHeight > viewportHeight - 20) {
      top = position.y - tooltipHeight - 10;
    }

    setTooltipStyle({
      left: `${left}px`,
      top: `${top}px`,
      opacity: 1,
      pointerEvents: "none",
    });
  }, [position, visible]);

  if (!event || !visible) {
    return null;
  }

  return (
    <div
      ref={tooltipRef}
      className="fixed z-50 bg-white rounded-md shadow-lg p-3 max-w-xs border border-gray-200 text-sm"
      style={tooltipStyle}
    >
      <div className="font-medium text-gray-900">
        {event.short_text || event.text.substring(0, 50) + "..."}
      </div>

      {event.temporal_anchoring?.real_time && (
        <div className="text-gray-500 text-xs mt-1">
          {formatDate(event.temporal_anchoring.real_time)}
        </div>
      )}

      <div className="text-gray-700 mt-2 text-xs line-clamp-3">
        {event.text}
      </div>

      {type === "topic" && event.topic && (
        <div className="mt-2 flex flex-wrap gap-1">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
            {event.topic.main_topic}
          </span>
          {event.topic.sub_topic &&
            event.topic.sub_topic.map((subTopic, i) => (
              <span
                key={i}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700"
              >
                {subTopic}
              </span>
            ))}
        </div>
      )}

      {type === "entity" && event.entities && (
        <div className="mt-2 flex flex-wrap gap-1">
          {event.entities.map((entity, i) => (
            <span
              key={i}
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800"
            >
              {entity.name}
              {entity.social_role && (
                <span className="ml-1 text-xs text-green-600">
                  ({entity.social_role})
                </span>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
