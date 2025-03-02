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
  // If entity is undefined or null, return "Unknown"
  if (!entity) {
    return "Unknown";
  }

  // If the attribute doesn't exist on this entity or is empty, return "Unknown"
  if (
    attribute === "" ||
    entity[attribute] === undefined ||
    entity[attribute] === null ||
    entity[attribute] === ""
  ) {
    return "Unknown";
  }

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

  // If no attribute is selected, return empty map
  if (!selectedAttribute) {
    return entityMentions;
  }

  events.forEach((event) => {
    event.entities.forEach((entity) => {
      // Skip entities that don't have the selected attribute
      if (
        entity[selectedAttribute] === undefined ||
        entity[selectedAttribute] === null ||
        entity[selectedAttribute] === ""
      ) {
        return;
      }

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
  // If no entity mentions, return empty array
  if (entityMentions.size === 0) {
    return [];
  }

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
  // If no visible entities or no selected attribute, return a default scale
  if (visibleEntities.length === 0 || !selectedAttribute) {
    return d3
      .scaleBand()
      .domain(["Unknown"])
      .range([0, totalColumnsWidth])
      .padding(0.1);
  }

  return d3
    .scaleBand()
    .domain(
      visibleEntities.map((e) => getEntityAttributeValue(e, selectedAttribute))
    )
    .range([0, totalColumnsWidth])
    .padding(0.1);
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
  // If the event has no entities, return an empty array
  if (!event.entities || event.entities.length === 0) {
    return [];
  }

  // Check if any entities have the selected attribute
  const hasSelectedAttribute = event.entities.some(
    (entity) =>
      entity[selectedAttribute] !== undefined &&
      entity[selectedAttribute] !== null &&
      entity[selectedAttribute] !== ""
  );

  // If no entities have the selected attribute, return all entities
  if (!hasSelectedAttribute) {
    return event.entities;
  }

  return event.entities.filter((entity) =>
    visibleEntities.find((e) => {
      // If both entities have names, match by name
      if (e.name && entity.name) {
        return e.name === entity.name;
      }
      // If names are not available, fall back to matching by the selected attribute
      return (
        getEntityAttributeValue(e, selectedAttribute) ===
        getEntityAttributeValue(entity, selectedAttribute)
      );
    })
  );
}

// Calculate connector line points for entities
export function calculateConnectorPoints(
  relevantEntities: Entity[],
  xScale: d3.ScaleBand<string>,
  selectedAttribute: string
) {
  // If no entities, return default values
  if (!relevantEntities || relevantEntities.length === 0) {
    return { xPoints: [], minX: 0, maxX: 0 };
  }

  // Filter entities that have the selected attribute
  const entitiesWithAttribute = relevantEntities.filter(
    (entity) =>
      entity[selectedAttribute] !== undefined &&
      entity[selectedAttribute] !== null &&
      entity[selectedAttribute] !== ""
  );

  // If no entities have the attribute, use a default position
  if (entitiesWithAttribute.length === 0) {
    const defaultX = xScale.range()[0] + xScale.bandwidth() / 2;
    return { xPoints: [defaultX], minX: defaultX, maxX: defaultX };
  }

  const xPoints = entitiesWithAttribute.map(
    (entity) =>
      xScale(getEntityAttributeValue(entity, selectedAttribute))! +
      xScale.bandwidth() / 2
  );

  const minX = Math.min(...xPoints);
  const maxX = Math.max(...xPoints);

  return { xPoints, minX, maxX };
}
