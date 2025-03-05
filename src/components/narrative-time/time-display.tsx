"use client";

import { NarrativeEvent } from "@/types/article";
import { useState, useEffect } from "react";
import { VisualizationDisplay } from "../shared/visualization-display";
import { NarrativeTimeVisual } from "./time-visual";
import { NarrativeTimeText } from "./time-text";
import { useCenterControl } from "@/lib/center-control-context";

interface TimeDisplayProps {
  events: NarrativeEvent[];
  metadata: {
    publishDate: string;
  };
  activeTab?: "visual" | "text";
}

type ViewMode = "visual" | "text";

export function TimeDisplay({ events, metadata, activeTab }: TimeDisplayProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(activeTab || "visual");
  const { selectedEventId, setSelectedEventId } = useCenterControl();

  // Update viewMode when activeTab changes
  useEffect(() => {
    if (activeTab) {
      setViewMode(activeTab);
    }
  }, [activeTab]);

  // If we're in the visualization page with activeTab prop, render just the content
  if (activeTab) {
    return activeTab === "visual" ? (
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
    );
  }

  // Otherwise, render the full visualization display with controls
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
