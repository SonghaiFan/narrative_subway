"use client";

import { NarrativeEvent } from "@/types/article";
import { useState, useCallback } from "react";
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

// Define the possible entity attributes we can display
const ENTITY_ATTRIBUTES = [
  { id: "name", label: "Name" },
  { id: "narrative_role", label: "Narrative Role" },
  { id: "archetypal_role", label: "Archetypal Role" },
  { id: "social_role", label: "Social Role" },
  { id: "discourse_role", label: "Discourse Role" },
  { id: "importance_level", label: "Importance Level" },
] as const;

type EntityAttribute = (typeof ENTITY_ATTRIBUTES)[number]["id"];

interface EntityDisplayProps {
  events: NarrativeEvent[];
}

type ViewMode = "visual" | "text";

export function EntityDisplay({ events }: EntityDisplayProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("visual");
  const [selectedAttribute, setSelectedAttribute] =
    useState<EntityAttribute>("name");
  const {
    selectedEntityId,
    setSelectedEntityId,
    selectedEventId,
    setSelectedEventId,
  } = useCenterControl();

  // Function to get available attributes in current entities
  const getAvailableAttributes = useCallback(() => {
    const availableAttrs = new Set<EntityAttribute>(["name"]);

    events.forEach((event) => {
      event.entities.forEach((entity) => {
        ENTITY_ATTRIBUTES.forEach((attr) => {
          if (entity[attr.id] !== undefined) {
            availableAttrs.add(attr.id);
          }
        });
      });
    });

    return Array.from(availableAttrs);
  }, [events]);

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
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select attribute" />
              </SelectTrigger>
              <SelectContent>
                {getAvailableAttributes().map((attrId) => {
                  const attr = ENTITY_ATTRIBUTES.find((a) => a.id === attrId);
                  if (!attr) return null;
                  return (
                    <SelectItem key={attr.id} value={attr.id}>
                      {attr.label}
                    </SelectItem>
                  );
                })}
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
          entityAttributes={ENTITY_ATTRIBUTES}
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
