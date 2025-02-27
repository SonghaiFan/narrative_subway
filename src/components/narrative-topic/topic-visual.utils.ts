import { NarrativeEvent } from "@/types/article";
import * as d3 from "d3";
import { TOPIC_CONFIG } from "./topic-config";

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

export interface GroupedPoint {
  key: string;
  points: DataPoint[];
  mainTopic: string;
  x: number;
  y: number;
  isExpanded: boolean;
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
    .padding(0.3);

  const xScale = d3
    .scaleTime()
    .domain(d3.extent(dataPoints, (d) => d.realTime) as [Date, Date])
    .range([0, width])
    .nice();

  return { xScale, yScale };
}

// Calculate dimensions based on container and config
export function calculateDimensions(
  containerWidth: number,
  containerHeight: number
) {
  // Calculate usable dimensions
  const width = Math.max(
    0,
    containerWidth - TOPIC_CONFIG.margin.left - TOPIC_CONFIG.margin.right
  );
  const height = Math.max(
    0,
    containerHeight - TOPIC_CONFIG.margin.top - TOPIC_CONFIG.margin.bottom
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
  const xAxis = d3.axisTop(xScale).tickSize(5).tickPadding(10);

  const yAxis = d3.axisLeft(yScale).tickSize(5).tickPadding(5);

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

// Group overlapping points
export function groupOverlappingPoints(
  dataPoints: DataPoint[],
  xScale: d3.ScaleTime<number, number>,
  yScale: d3.ScaleBand<string>
): GroupedPoint[] {
  const groups = new Map<string, DataPoint[]>();
  const nodeSize = TOPIC_CONFIG.point.radius * 2;
  const timeThreshold = Math.abs(
    xScale.invert(nodeSize / 4).getTime() - xScale.invert(0).getTime()
  );

  // Sort points by time and topic
  const sortedPoints = [...dataPoints].sort((a, b) => {
    const timeCompare = a.realTime.getTime() - b.realTime.getTime();
    if (timeCompare === 0) {
      return a.mainTopic.localeCompare(b.mainTopic);
    }
    return timeCompare;
  });

  // Group points that are close in time and in same topic
  sortedPoints.forEach((point) => {
    let foundGroup = false;

    // Check existing groups for a match
    for (const [key, points] of groups.entries()) {
      const lastPoint = points[points.length - 1];
      const timeDiff = Math.abs(
        point.realTime.getTime() - lastPoint.realTime.getTime()
      );

      if (
        point.mainTopic === lastPoint.mainTopic &&
        timeDiff <= timeThreshold
      ) {
        points.push(point);
        foundGroup = true;
        break;
      }
    }

    // Create new group if no match found
    if (!foundGroup) {
      const x = xScale(point.realTime);
      const y = yScale(point.mainTopic)! + yScale.bandwidth() / 2;
      const key = `${Math.round(x)},${Math.round(y)}`;
      groups.set(key, [point]);
    }
  });

  // Create GroupedPoints from the groups
  return Array.from(groups.entries())
    .filter(([_, points]) => points.length > 0)
    .map(([key, points]) => {
      // Calculate average time for the group
      const avgTime = new Date(
        points.reduce((sum, p) => sum + p.realTime.getTime(), 0) / points.length
      );

      return {
        key,
        points,
        mainTopic: points[0].mainTopic,
        x: xScale(avgTime),
        y: yScale(points[0].mainTopic)! + yScale.bandwidth() / 2,
        isExpanded: false,
      };
    });
}

// Calculate positions for expanded child nodes
export function calculateExpandedPositions(
  group: GroupedPoint,
  radius: number
): { x: number; y: number }[] {
  const positions: { x: number; y: number }[] = [];
  const n = group.points.length;

  if (n === 1) {
    return [{ x: group.x, y: group.y }];
  }

  // Calculate radius for the circle of nodes
  const circleRadius = radius * 2;
  const angleStep = (2 * Math.PI) / n;

  for (let i = 0; i < n; i++) {
    const angle = i * angleStep;
    positions.push({
      x: group.x + circleRadius * Math.cos(angle),
      y: group.y + circleRadius * Math.sin(angle),
    });
  }

  return positions;
}
