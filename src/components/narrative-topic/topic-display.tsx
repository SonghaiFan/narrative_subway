"use client";

import { NarrativeEvent } from "@/types/article";
import { useState, useEffect } from "react";
import { VisualizationDisplay } from "../shared/visualization-display";
import { NarrativeTopicVisual } from "./topic-visual";
import { NarrativeTopicText } from "./topic-text";
import { useCenterControl } from "@/lib/center-control-context";

interface TopicDisplayProps {
  events: NarrativeEvent[];
  metadata?: any;
  activeTab?: "visual" | "text";
}

type ViewMode = "visual" | "text";

export function TopicDisplay({
  events,
  metadata,
  activeTab,
}: TopicDisplayProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(activeTab || "visual");
  const {
    selectedEventId,
    setSelectedEventId,
    selectedTopic,
    setSelectedTopic,
  } = useCenterControl();

  // Update viewMode when activeTab changes
  useEffect(() => {
    if (activeTab) {
      setViewMode(activeTab);
    }
  }, [activeTab]);

  // If we're in the visualization page with activeTab prop, render just the content
  if (activeTab) {
    return activeTab === "visual" ? (
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
    );
  }

  // Otherwise, render the full visualization display with controls
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
