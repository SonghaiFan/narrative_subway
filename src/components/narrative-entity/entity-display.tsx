"use client";

import { NarrativeEvent } from "@/types/article";
import { useState } from "react";
import { VisualizationDisplay } from "../shared/visualization-display";
import { EntityVisual } from "./entity-visual";
import { EntityText } from "./entity-text";

interface EntityDisplayProps {
  events: NarrativeEvent[];
}

type ViewMode = "visual" | "text";

export function EntityDisplay({ events }: EntityDisplayProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("visual");

  return (
    <VisualizationDisplay
      title="Entity"
      viewMode={viewMode}
      setViewMode={setViewMode}
      isEmpty={!events.length}
    >
      {viewMode === "visual" ? (
        <EntityVisual events={events} />
      ) : (
        <EntityText events={events} />
      )}
    </VisualizationDisplay>
  );
}
