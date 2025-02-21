"use client";

import { TimelineEvent } from "@/types/article";
import { useState } from "react";
import { VisualizationDisplay } from "../shared/visualization-display";
import { NarrativeTopicVisual } from "./topic-visual";
import { NarrativeTopicText } from "./topic-text";

interface TopicDisplayProps {
  events: TimelineEvent[];
  selectedEventId?: string;
}

type ViewMode = "visual" | "text";

export function TopicDisplay({ events, selectedEventId }: TopicDisplayProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("visual");

  return (
    <VisualizationDisplay
      title="Topic Flow"
      viewMode={viewMode}
      setViewMode={setViewMode}
      isEmpty={!events.length}
    >
      {viewMode === "visual" ? (
        <NarrativeTopicVisual
          events={events}
          selectedEventId={selectedEventId}
        />
      ) : (
        <NarrativeTopicText events={events} selectedEventId={selectedEventId} />
      )}
    </VisualizationDisplay>
  );
}
