"use client";

import { NarrativeEvent } from "@/types/article";
import { useState } from "react";
import { VisualizationDisplay } from "../shared/visualization-display";
import { NarrativeTopicVisual } from "./topic-visual";
import { NarrativeTopicText } from "./topic-text";
import { useCenterControl } from "@/lib/center-control-context";

interface TopicDisplayProps {
  events: NarrativeEvent[];
  selectedEventId?: number | null;
}

type ViewMode = "visual" | "text";

export function TopicDisplay({
  events,
  selectedEventId: propSelectedEventId,
}: TopicDisplayProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("visual");
  const {
    selectedEventId: contextSelectedEventId,
    setSelectedEventId,
    selectedTopic,
    setSelectedTopic,
  } = useCenterControl();

  // Use the prop if provided, otherwise use the context value
  const selectedEventId =
    propSelectedEventId !== undefined
      ? propSelectedEventId
      : contextSelectedEventId;

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
          onEventSelect={setSelectedEventId}
          selectedTopic={selectedTopic}
          onTopicSelect={setSelectedTopic}
        />
      ) : (
        <NarrativeTopicText
          events={events}
          selectedEventId={selectedEventId}
          onEventSelect={setSelectedEventId}
          selectedTopic={selectedTopic}
          onTopicSelect={setSelectedTopic}
        />
      )}
    </VisualizationDisplay>
  );
}
