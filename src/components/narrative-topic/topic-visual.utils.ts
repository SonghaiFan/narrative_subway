import { NarrativeEvent } from "@/types/article";
import * as d3 from "d3";
import { SHARED_CONFIG } from "../shared/visualization-config";

export interface DataPoint {
  event: NarrativeEvent;
  mainTopic: string;
  subTopics: string[];
  narrativeTime: number;
  sentiment: number;
  text: string;
  realTime: Date;
  index: number;
}

export interface Edge {
  source: DataPoint;
  target: DataPoint;
  mainTopic: string;
}

// Process events into data points
export function processEvents(events: NarrativeEvent[]): DataPoint[] {
  const validEvents = events.filter((e) => e.temporal_anchoring.real_time);
  return validEvents.map((event, index) => ({
    event,
    mainTopic: event.topic.main_topic,
    subTopics: event.topic.sub_topic,
    narrativeTime: event.temporal_anchoring.narrative_time,
    sentiment: event.topic.sentiment.intensity,
    text: event.text,
    realTime: new Date(event.temporal_anchoring.real_time!),
    index,
  }));
}

// Get unique topics and their counts
export function getTopicCounts(dataPoints: DataPoint[]): Map<string, number> {
  const topicCounts = new Map<string, number>();
  dataPoints.forEach((point) => {
    topicCounts.set(
      point.mainTopic,
      (topicCounts.get(point.mainTopic) || 0) + 1
    );
  });
  return topicCounts;
}

// Get all unique topics sorted by frequency
export function getTopTopics(topicCounts: Map<string, number>): string[] {
  return Array.from(topicCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([topic]) => topic);
}

// Get scales for the visualization
export function getScales(
  dataPoints: DataPoint[],
  topTopics: string[],
  width: number,
  height: number
) {
  const yScale = d3
    .scaleBand()
    .domain(topTopics)
    .range([0, height])
    .padding(0.2);

  const xScale = d3
    .scaleTime()
    .domain(d3.extent(dataPoints, (d) => d.realTime) as [Date, Date])
    .range([0, width])
    .nice();

  return { xScale, yScale };
}

// Get fill and stroke colors based on sentiment
export function getPointColors(sentiment: number) {
  return {
    fill: sentiment > 0 ? "#ffffff" : sentiment < 0 ? "#f3f3f3" : "#ffffff",
    stroke: sentiment > 0 ? "#000000" : sentiment < 0 ? "#666666" : "#999999",
  };
}

// Calculate dimensions based on container and config
export function calculateDimensions(
  containerWidth: number,
  containerHeight: number
) {
  // Calculate usable dimensions
  const width = Math.max(
    0,
    containerWidth - SHARED_CONFIG.margin.left - SHARED_CONFIG.margin.right
  );
  const height = Math.max(
    0,
    containerHeight - SHARED_CONFIG.margin.top - SHARED_CONFIG.margin.bottom
  );

  return {
    containerWidth,
    containerHeight,
    width,
    height,
  };
}

// Create axes for the visualization
export function createAxes(
  xScale: d3.ScaleTime<number, number>,
  yScale: d3.ScaleBand<string>
) {
  const xAxis = d3
    .axisTop(xScale)
    .tickSize(SHARED_CONFIG.axis.tickSize)
    .tickPadding(SHARED_CONFIG.axis.tickPadding);

  const yAxis = d3
    .axisLeft(yScale)
    .tickSize(SHARED_CONFIG.axis.tickSize)
    .tickPadding(SHARED_CONFIG.axis.tickPadding);

  return { xAxis, yAxis };
}

// Create edges between events that share the same main topic and are adjacent in time
export function createEdges(dataPoints: DataPoint[]): Edge[] {
  const edges: Edge[] = [];

  // Sort data points by real time
  const sortedPoints = [...dataPoints].sort(
    (a, b) => a.realTime.getTime() - b.realTime.getTime()
  );

  // Create edges between consecutive events with the same main topic
  for (let i = 0; i < sortedPoints.length - 1; i++) {
    const current = sortedPoints[i];
    const next = sortedPoints[i + 1];

    if (current.mainTopic === next.mainTopic) {
      edges.push({
        source: current,
        target: next,
        mainTopic: current.mainTopic,
      });
    }
  }

  return edges;
}
