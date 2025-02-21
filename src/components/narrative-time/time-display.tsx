"use client";

import { TimelineEvent } from "@/types/article";
import { useState } from "react";
import { VisualizationDisplay } from "../shared/visualization-display";
import { NarrativeTimeVisual } from "./time-visual";
import { NarrativeTimeText } from "./time-text";

interface TimeDisplayProps {
  events: TimelineEvent[];
  selectedEventId?: string;
}

type ViewMode = "visual" | "text";

export function TimeDisplay({ events, selectedEventId }: TimeDisplayProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("visual");

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
        />
      ) : (
        <NarrativeTimeText events={events} selectedEventId={selectedEventId} />
      )}
    </VisualizationDisplay>
  );
}
