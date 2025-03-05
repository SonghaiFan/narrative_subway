"use client";

import { Entity, NarrativeEvent } from "@/types/article";
import { useState, useCallback, useEffect, useMemo } from "react";
import { VisualizationDisplay } from "../shared/visualization-display";
import { EntityVisual } from "./entity-visual";
import { EntityText } from "./entity-text";
import { useCenterControl } from "@/lib/center-control-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Helper function to format attribute labels
const formatAttributeLabel = (attr: string): string => {
  return attr
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

type EntityAttribute = string;

interface EntityDisplayProps {
  events: NarrativeEvent[];
  metadata?: any;
  activeTab?: "visual" | "text";
}

type ViewMode = "visual" | "text";

export function EntityDisplay({
  events,
  metadata,
  activeTab,
}: EntityDisplayProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(activeTab || "visual");
  const [selectedAttribute, setSelectedAttribute] =
    useState<EntityAttribute>("");
  const {
    selectedEntityId,
    setSelectedEntityId,
    selectedEventId,
    setSelectedEventId,
  } = useCenterControl();

  // Update viewMode when activeTab changes
  useEffect(() => {
    if (activeTab) {
      setViewMode(activeTab);
    }
  }, [activeTab]);

  // Function to get available attributes in current entities
  const getAvailableAttributes = useCallback(() => {
    const availableAttrs = new Set<EntityAttribute>();
    const allAttributes = new Set<string>();

    // First pass: collect all possible attributes from entities
    events.forEach((event) => {
      event.entities.forEach((entity) => {
        // Get all keys from the entity object
        Object.keys(entity).forEach((key) => {
          // Skip 'id' and 'name' as they're not visualization attributes
          if (key !== "id" && key !== "name") {
            allAttributes.add(key);
          }
        });
      });
    });

    // Second pass: check which attributes have values
    events.forEach((event) => {
      event.entities.forEach((entity) => {
        allAttributes.forEach((attr) => {
          if (
            entity[attr] !== undefined &&
            entity[attr] !== null &&
            entity[attr] !== ""
          ) {
            availableAttrs.add(attr);
          }
        });
      });
    });

    // If no attributes are found, return an empty array
    if (availableAttrs.size === 0) {
      return [];
    }

    // Convert to array and sort alphabetically
    return Array.from(availableAttrs).sort();
  }, [events]);

  // Memoize the available attributes to avoid recalculation
  const availableAttributes = useMemo(
    () => getAvailableAttributes(),
    [getAvailableAttributes]
  );

  // Set initial attribute when events change
  useEffect(() => {
    if (
      availableAttributes.length > 0 &&
      (!availableAttributes.includes(selectedAttribute) ||
        selectedAttribute === "")
    ) {
      setSelectedAttribute(availableAttributes[0]);
    }
  }, [availableAttributes, selectedAttribute]);

  // If we're in the visualization page with activeTab prop, render just the content
  if (activeTab) {
    return activeTab === "visual" ? (
      <EntityVisual
        events={events}
        selectedAttribute={selectedAttribute}
        selectedEntityId={selectedEntityId}
        onEntitySelect={setSelectedEntityId}
        selectedEventId={selectedEventId}
        onEventSelect={setSelectedEventId}
      />
    ) : (
      <EntityText
        events={events}
        selectedEntityId={selectedEntityId}
        onEntitySelect={setSelectedEntityId}
        selectedEventId={selectedEventId}
        onEventSelect={setSelectedEventId}
      />
    );
  }

  // Otherwise, render the full visualization display with controls
  return (
    <VisualizationDisplay
      title="Entity"
      viewMode={viewMode}
      setViewMode={setViewMode}
      isEmpty={!events.length}
      headerContent={
        viewMode === "visual" && (
          <div className="flex items-center gap-2">
            <Select
              value={selectedAttribute}
              onValueChange={(value: EntityAttribute) =>
                setSelectedAttribute(value)
              }
            >
              <SelectTrigger className="w-[150px] h-7 px-2 py-1 text-xs">
                <SelectValue placeholder="Select attribute" />
              </SelectTrigger>
              <SelectContent>
                {availableAttributes.map((attrId) => (
                  <SelectItem
                    key={attrId}
                    value={attrId}
                    className="text-xs py-1"
                  >
                    {formatAttributeLabel(attrId)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )
      }
    >
      {viewMode === "visual" ? (
        <EntityVisual
          events={events}
          selectedAttribute={selectedAttribute}
          selectedEntityId={selectedEntityId}
          onEntitySelect={setSelectedEntityId}
          selectedEventId={selectedEventId}
          onEventSelect={setSelectedEventId}
        />
      ) : (
        <EntityText
          events={events}
          selectedEntityId={selectedEntityId}
          onEntitySelect={setSelectedEntityId}
          selectedEventId={selectedEventId}
          onEventSelect={setSelectedEventId}
        />
      )}
    </VisualizationDisplay>
  );
}
