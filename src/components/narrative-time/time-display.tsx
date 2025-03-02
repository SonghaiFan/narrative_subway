"use client";

import { NarrativeEvent } from "@/types/article";
import { useState } from "react";
import { VisualizationDisplay } from "../shared/visualization-display";
import { NarrativeTimeVisual } from "./time-visual";
import { NarrativeTimeText } from "./time-text";
import { useCenterControl } from "@/lib/center-control-context";

interface TimeDisplayProps {
  events: NarrativeEvent[];
  metadata: {
    publishDate: string;
  };
}

type ViewMode = "visual" | "text";

export function TimeDisplay({ events, metadata }: TimeDisplayProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("visual");
  const { selectedEventId, setSelectedEventId } = useCenterControl();

  return (
    <VisualizationDisplay
      title="Time"
      viewMode={viewMode}
      setViewMode={setViewMode}
      isEmpty={!events.length}
    >
      {viewMode === "visual" ? (
        <NarrativeTimeVisual
          events={events}
          selectedEventId={selectedEventId}
          metadata={metadata}
          onEventSelect={setSelectedEventId}
        />
      ) : (
        <NarrativeTimeText
          events={events}
          selectedEventId={selectedEventId}
          onEventSelect={setSelectedEventId}
        />
      )}
    </VisualizationDisplay>
  );
}
