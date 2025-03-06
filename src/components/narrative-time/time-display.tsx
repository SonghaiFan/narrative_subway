"use client";

import { NarrativeEvent } from "@/types/article";
import { VisualizationDisplay } from "../shared/visualization-display";
import { NarrativeTimeVisual } from "./time-visual";

interface TimeDisplayProps {
  events: NarrativeEvent[];
  metadata: {
    publishDate: string;
  };
}

export function TimeDisplay({ events, metadata }: TimeDisplayProps) {
  return (
    <VisualizationDisplay title="Time" isEmpty={!events.length}>
      <NarrativeTimeVisual events={events} metadata={metadata} />
    </VisualizationDisplay>
  );
}
