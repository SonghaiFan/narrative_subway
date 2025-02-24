import { NarrativeEvent } from "@/types/article";
import { TIME_CONFIG } from "../shared/visualization-config";
import * as d3 from "d3";

export interface DataPoint {
  event: NarrativeEvent;
  realTime: Date;
  narrativeTime: number;
  index: number;
}

export interface LabelDatum extends d3.SimulationNodeDatum {
  id: number;
  x: number;
  y: number;
  text: string;
  point: { x: number; y: number };
  width: number;
  height: number;
  index: number;
}

// Process events into data points
export function processEvents(events: NarrativeEvent[]): DataPoint[] {
  const validEvents = events.filter((e) => e.temporal_anchoring.real_time);
  return validEvents.map((event, index) => ({
    event,
    realTime: new Date(event.temporal_anchoring.real_time!),
    narrativeTime: event.temporal_anchoring.narrative_time,
    index,
  }));
}

// Create sorted points for line drawing
export function getSortedPoints(dataPoints: DataPoint[]): DataPoint[] {
  return [...dataPoints].sort((a, b) => {
    const timeCompare = a.narrativeTime - b.narrativeTime;
    if (timeCompare !== 0) return timeCompare;
    return a.realTime.getTime() - b.realTime.getTime();
  });
}

// Get scales for the visualization
export function getScales(
  dataPoints: DataPoint[],
  width: number,
  height: number
) {
  const xScale = d3
    .scaleTime()
    .domain(d3.extent(dataPoints, (d) => d.realTime) as [Date, Date])
    .range([0, width])
    .nice();

  const minTime = Math.min(...dataPoints.map((d) => d.narrativeTime));
  const maxTime = Math.max(...dataPoints.map((d) => d.narrativeTime));

  const yScale = d3
    .scaleLinear()
    .domain([minTime, maxTime])
    .range([0, height])
    .nice();

  return { xScale, yScale };
}

// Create label data for force layout
export function createLabelData(
  dataPoints: DataPoint[],
  xScale: d3.ScaleTime<number, number>,
  yScale: d3.ScaleLinear<number, number>
): LabelDatum[] {
  return dataPoints.map((d, i) => ({
    id: i,
    x: xScale(d.realTime),
    y: yScale(d.narrativeTime) - 30,
    text:
      d.event.text.length > 30
        ? d.event.text.slice(0, 27) + "..."
        : d.event.text,
    point: {
      x: xScale(d.realTime),
      y: yScale(d.narrativeTime),
    },
    width: 0,
    height: 0,
    fx: undefined,
    fy: undefined,
    index: d.index,
  }));
}

// Get fill and stroke colors based on sentiment
export function getPointColors(sentiment: number) {
  return {
    fill:
      sentiment > 0
        ? TIME_CONFIG.point.positiveFill
        : sentiment < 0
        ? TIME_CONFIG.point.negativeFill
        : TIME_CONFIG.point.neutralFill,
    stroke:
      sentiment > 0
        ? TIME_CONFIG.point.positiveStroke
        : sentiment < 0
        ? TIME_CONFIG.point.negativeStroke
        : TIME_CONFIG.point.neutralStroke,
  };
}

// Create force simulation for labels
export function createForceSimulation(
  labelData: LabelDatum[],
  width: number,
  height: number
) {
  return d3
    .forceSimulation<LabelDatum>(labelData)
    .force(
      "collision",
      d3
        .forceCollide<LabelDatum>()
        .radius((d) => Math.sqrt(d.width / 2 + d.height / 2))
        .strength(0.2)
    )
    .force(
      "y",
      d3
        .forceY<LabelDatum>()
        .y((d) => d.point.y - 30)
        .strength(0.15)
    )
    .force("boundary", () => {
      for (let node of labelData) {
        node.x = Math.max(
          node.width / 2,
          Math.min(width - node.width / 2, node.point.x)
        );
        node.y = Math.max(
          node.height / 2 - 2,
          Math.min(height - node.height / 2 + 2, node.y)
        );
      }
    });
}

// Calculate dimensions based on container and config
export function calculateDimensions(
  containerWidth: number,
  eventsLength: number
) {
  const minHeight =
    eventsLength * 20 + TIME_CONFIG.margin.top + TIME_CONFIG.margin.bottom;
  const containerHeight = Math.max(minHeight, TIME_CONFIG.minHeight);
  const width =
    containerWidth - TIME_CONFIG.margin.left - TIME_CONFIG.margin.right;
  const height =
    containerHeight - TIME_CONFIG.margin.top - TIME_CONFIG.margin.bottom;

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
  yScale: d3.ScaleLinear<number, number>
) {
  const xAxis = d3
    .axisTop(xScale)
    .tickSize(TIME_CONFIG.axis.tickSize)
    .tickPadding(TIME_CONFIG.axis.tickPadding);

  const yAxis = d3
    .axisLeft(yScale)
    .tickSize(TIME_CONFIG.axis.tickSize)
    .tickPadding(TIME_CONFIG.axis.tickPadding);

  return { xAxis, yAxis };
}

// Create line generator for the path
export function createLineGenerator(
  xScale: d3.ScaleTime<number, number>,
  yScale: d3.ScaleLinear<number, number>
) {
  return d3
    .line<DataPoint>()
    .x((d) => xScale(d.realTime))
    .y((d) => yScale(d.narrativeTime))
    .curve(d3.curveLinear);
}
