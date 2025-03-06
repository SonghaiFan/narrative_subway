"use client";

import { NarrativeEvent } from "@/types/article";
import { VisualizationDisplay } from "../shared/visualization-display";
import { NarrativeTopicVisual } from "./topic-visual";

interface TopicDisplayProps {
  events: NarrativeEvent[];
}

export function TopicDisplay({ events }: TopicDisplayProps) {
  return (
    <VisualizationDisplay title="Topic Flow" isEmpty={!events.length}>
      <NarrativeTopicVisual events={events} />
    </VisualizationDisplay>
  );
}
