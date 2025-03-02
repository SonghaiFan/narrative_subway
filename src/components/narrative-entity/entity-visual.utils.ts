import { Entity, NarrativeEvent } from "@/types/article";
import * as d3 from "d3";
import { ENTITY_CONFIG } from "./entity-config";

export type EntityAttribute = string;

export interface EntityMention {
  entity: Entity;
  count: number;
}

// Function to get entity attribute value
export function getEntityAttributeValue(
  entity: Entity,
  attribute: EntityAttribute
): string {
  const value = entity[attribute];
  return value?.toString() || "Unknown";
}

// Calculate dimensions for the visualization
export function calculateDimensions(
  containerWidth: number,
  eventsLength: number
) {
  const width =
    containerWidth - ENTITY_CONFIG.margin.left - ENTITY_CONFIG.margin.right;
  const minHeight =
    eventsLength * 20 + ENTITY_CONFIG.margin.top + ENTITY_CONFIG.margin.bottom;
  const containerHeight = Math.max(minHeight, ENTITY_CONFIG.minHeight);
  const height =
    containerHeight - ENTITY_CONFIG.margin.top - ENTITY_CONFIG.margin.bottom;

  return { containerWidth, width, containerHeight, height };
}

// Calculate how many entities can fit based on available width
export function calculateMaxEntities(
  availableWidth: number,
  minColumnWidth: number,
  columnGap: number
): number {
  return Math.floor(
    (availableWidth + columnGap) / (minColumnWidth + columnGap)
  );
}

// Get entity mentions count from events
export function getEntityMentions(
  events: NarrativeEvent[],
  selectedAttribute: string
): Map<string, EntityMention> {
  const entityMentions = new Map<string, EntityMention>();

  events.forEach((event) => {
    event.entities.forEach((entity) => {
      const key = getEntityAttributeValue(entity, selectedAttribute);
      if (!entityMentions.has(key)) {
        entityMentions.set(key, { entity, count: 1 });
      } else {
        const current = entityMentions.get(key)!;
        entityMentions.set(key, { entity, count: current.count + 1 });
      }
    });
  });

  return entityMentions;
}

// Get visible entities based on available space
export function getVisibleEntities(
  entityMentions: Map<string, EntityMention>,
  maxEntities: number
): Entity[] {
  return Array.from(entityMentions.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, maxEntities)
    .map((item) => item.entity);
}

// Calculate column width and layout dimensions
export function calculateColumnLayout(
  width: number,
  visibleEntities: Entity[]
) {
  // Calculate responsive column width
  const totalGapWidth =
    (visibleEntities.length - 1) * ENTITY_CONFIG.entity.columnGap;
  const availableWidth = width - totalGapWidth;
  const columnWidth = Math.min(
    ENTITY_CONFIG.entity.maxColumnWidth,
    Math.max(
      ENTITY_CONFIG.entity.minColumnWidth,
      availableWidth / visibleEntities.length
    )
  );

  // Calculate total width including gaps
  const totalColumnsWidth =
    columnWidth * visibleEntities.length + totalGapWidth;

  // Center the visualization if total width is less than available width
  const leftOffset =
    ENTITY_CONFIG.margin.left + (width - totalColumnsWidth) / 2;

  return {
    totalGapWidth,
    availableWidth,
    columnWidth,
    totalColumnsWidth,
    leftOffset,
  };
}

// Create scale for x-axis
export function createXScale(
  visibleEntities: Entity[],
  selectedAttribute: string,
  totalColumnsWidth: number
) {
  return d3
    .scaleBand()
    .domain(
      visibleEntities.map((e) => getEntityAttributeValue(e, selectedAttribute))
    )
    .range([0, totalColumnsWidth])
    .padding(ENTITY_CONFIG.entity.columnPadding);
}

// Create scale for y-axis
export function createYScale(events: NarrativeEvent[], height: number) {
  const maxTime = Math.max(
    ...events.map((e) => e.temporal_anchoring.narrative_time)
  );

  return d3
    .scaleLinear()
    .domain([0, Math.ceil(maxTime) + 1])
    .range([0, height])
    .nice();
}

// Create y-axis with integer ticks
export function createYAxis(yScale: d3.ScaleLinear<number, number>) {
  return d3
    .axisLeft(yScale)
    .tickSize(5)
    .tickPadding(5)
    .ticks(Math.ceil(yScale.domain()[1]))
    .tickFormat(d3.format("d"));
}

// Filter relevant entities for an event
export function getRelevantEntities(
  event: NarrativeEvent,
  visibleEntities: Entity[],
  selectedAttribute: string
) {
  return event.entities.filter((entity) =>
    visibleEntities.find(
      (e) =>
        getEntityAttributeValue(e, selectedAttribute) ===
        getEntityAttributeValue(entity, selectedAttribute)
    )
  );
}

// Calculate connector line points for entities
export function calculateConnectorPoints(
  relevantEntities: Entity[],
  xScale: d3.ScaleBand<string>,
  selectedAttribute: string
) {
  const xPoints = relevantEntities.map(
    (entity) =>
      xScale(getEntityAttributeValue(entity, selectedAttribute))! +
      xScale.bandwidth() / 2
  );

  const minX = Math.min(...xPoints);
  const maxX = Math.max(...xPoints);

  return { xPoints, minX, maxX };
}
