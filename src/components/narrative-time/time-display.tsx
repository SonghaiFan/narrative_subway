"use client";

import { NarrativeEvent } from "@/types/article";
import { useState } from "react";
import { VisualizationDisplay } from "../shared/visualization-display";
import { NarrativeTimeVisual } from "./time-visual";
import { NarrativeTimeText } from "./time-text";

interface TimeDisplayProps {
  events: NarrativeEvent[];
  selectedEventId?: string;
  metadata: {
    publishDate: string;
  };
}

type ViewMode = "visual" | "text";

export function TimeDisplay({
  events,
  selectedEventId,
  metadata,
}: TimeDisplayProps) {
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
          metadata={metadata}
        />
      ) : (
        <NarrativeTimeText events={events} selectedEventId={selectedEventId} />
      )}
    </VisualizationDisplay>
  );
}
