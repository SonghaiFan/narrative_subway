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
  // Swap the axes: topics on x-axis, narrative index on y-axis
  const xScale = d3
    .scaleBand()
    .domain(topTopics)
    .range([0, width])
    .padding(0.3);

  // Use narrative time for y-axis, matching the entity-visual approach
  const maxTime = Math.max(...dataPoints.map((d) => d.narrativeTime));

  const yScale = d3
    .scaleLinear()
    .domain([0, Math.ceil(maxTime) + 1])
    .range([0, height])
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
  xScale: d3.ScaleBand<string>,
  yScale: d3.ScaleLinear<number, number>
) {
  // Update axis creation for the new orientation
  const xAxis = d3.axisTop(xScale).tickSize(5).tickPadding(10);

  // Create y-axis with integer ticks, matching the entity-visual approach
  const yAxis = d3
    .axisLeft(yScale)
    .tickSize(5)
    .tickPadding(5)
    .ticks(Math.ceil(yScale.domain()[1]))
    .tickFormat(d3.format("d"));

  return { xAxis, yAxis };
}

// Create edges between events that share the same main topic and are adjacent in time
export function createEdges(dataPoints: DataPoint[]): Edge[] {
  const edges: Edge[] = [];

  // Sort data points by narrative index
  const sortedPoints = [...dataPoints].sort(
    (a, b) => a.narrativeTime - b.narrativeTime
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
  xScale: d3.ScaleBand<string>,
  yScale: d3.ScaleLinear<number, number>
): GroupedPoint[] {
  const groups = new Map<string, DataPoint[]>();
  const nodeSize = TOPIC_CONFIG.point.radius * 2;

  // Calculate narrative index threshold based on current scale
  // This makes the grouping responsive to the container height
  const indexThreshold = Math.abs(yScale.invert(nodeSize) - yScale.invert(0));

  // Sort points by topic and narrative index
  const sortedPoints = [...dataPoints].sort((a, b) => {
    const topicCompare = a.mainTopic.localeCompare(b.mainTopic);
    if (topicCompare === 0) {
      return a.narrativeTime - b.narrativeTime;
    }
    return topicCompare;
  });

  // Group points that are close in narrative index and in same topic
  sortedPoints.forEach((point) => {
    let foundGroup = false;

    // Check existing groups for a match
    for (const [key, points] of groups.entries()) {
      const lastPoint = points[points.length - 1];
      const indexDiff = Math.abs(point.narrativeTime - lastPoint.narrativeTime);

      if (
        point.mainTopic === lastPoint.mainTopic &&
        indexDiff <= indexThreshold
      ) {
        points.push(point);
        foundGroup = true;
        break;
      }
    }

    // Create new group if no match found
    if (!foundGroup) {
      const x = xScale(point.mainTopic)! + xScale.bandwidth() / 2;
      const y = yScale(point.narrativeTime);
      const key = `${Math.round(x)},${Math.round(y)}`;
      groups.set(key, [point]);
    }
  });

  // Create GroupedPoints from the groups
  return Array.from(groups.entries())
    .filter(([_, points]) => points.length > 0)
    .map(([key, points]) => {
      // Calculate average narrative index for the group
      const avgNarrativeTime =
        points.reduce((sum, p) => sum + p.narrativeTime, 0) / points.length;

      return {
        key,
        points,
        mainTopic: points[0].mainTopic,
        x: xScale(points[0].mainTopic)! + xScale.bandwidth() / 2,
        y: yScale(avgNarrativeTime),
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
  // Scale the circle radius based on the number of points
  // to ensure they don't overlap or go too far from the center
  const circleRadius = Math.max(
    radius * 2,
    Math.min(radius * 3, radius * (1 + n * 0.2))
  );

  // Distribute points evenly in a circle
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
