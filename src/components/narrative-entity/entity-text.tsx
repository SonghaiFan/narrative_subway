import { Entity, NarrativeEvent } from "@/types/article";
import { useState } from "react";

interface EntityContext {
  id: string;
  entity: Entity;
  frequency: number;
  mentions: {
    text: string;
    date: string;
    topic: string;
    sentiment: {
      polarity: string;
      intensity: number;
    };
  }[];
}

export interface EntityTextProps {
  events: NarrativeEvent[];
  selectedEntityId?: string | null;
  onEntitySelect?: (id: string | null) => void;
  selectedEventId?: number | null;
  onEventSelect?: (id: number | null) => void;
}

export function EntityText({ events }: EntityTextProps) {
  const [expandedEntities, setExpandedEntities] = useState<Set<string>>(
    new Set()
  );
  // Show all entities by default
  const [showAllEntities, setShowAllEntities] = useState(true);

  // Build rich entity context
  const entityContextMap = new Map<string, EntityContext>();

  // First pass: collect all unique entities by ID
  const uniqueEntitiesById = new Map<string, Entity>();

  events.forEach((event) => {
    if (!event?.entities) return;
    event.entities.forEach((entity) => {
      if (!entity?.id) return;
      if (!uniqueEntitiesById.has(entity.id)) {
        uniqueEntitiesById.set(entity.id, entity);
      }
    });
  });

  // Initialize count map for each unique entity
  const entityCounts = new Map<string, number>();
  uniqueEntitiesById.forEach((_, id) => {
    entityCounts.set(id, 0);
  });

  // Second pass: count occurrences of each entity across all events
  // Count each entity only once per event
  events.forEach((event) => {
    if (!event?.entities) return;

    // Track which entities we've already counted in this event
    const countedInThisEvent = new Set<string>();

    event.entities.forEach((entity) => {
      if (!entity?.id) return;

      // Only count each unique entity once per event
      if (!countedInThisEvent.has(entity.id)) {
        const currentCount = entityCounts.get(entity.id) || 0;
        entityCounts.set(entity.id, currentCount + 1);
        countedInThisEvent.add(entity.id);

        // Add to context map
        const existingContext = entityContextMap.get(entity.id) || {
          id: entity.id,
          entity,
          frequency: 0,
          mentions: [],
        };

        existingContext.frequency = entityCounts.get(entity.id) || 0;

        // Only add the mention if we haven't already added it
        if (!existingContext.mentions.some((m) => m.text === event.text)) {
          existingContext.mentions.push({
            text: event.text,
            date:
              event.temporal_anchoring?.real_time ||
              event.temporal_anchoring?.anchor ||
              "Unknown date",
            topic: event.topic.main_topic,
            sentiment: event.topic.sentiment,
          });
        }

        entityContextMap.set(entity.id, existingContext);
      }
    });
  });

  const sortedEntities = Array.from(entityContextMap.values()).sort(
    (a, b) => b.frequency - a.frequency
  );

  // Calculate role type and social role distributions
  const discourseRoleCounts = new Map<string, number>();
  const socialRoleCounts = new Map<string, number>();
  const totalMentions = sortedEntities.reduce(
    (sum, { frequency }) => sum + frequency,
    0
  );

  sortedEntities.forEach(({ entity }) => {
    if (entity.discourse_role) {
      discourseRoleCounts.set(
        entity.discourse_role,
        (discourseRoleCounts.get(entity.discourse_role) || 0) + 1
      );
    }
    if (entity.social_role) {
      socialRoleCounts.set(
        entity.social_role,
        (socialRoleCounts.get(entity.social_role) || 0) + 1
      );
    }
  });

  const toggleEntity = (entityId: string) => {
    setExpandedEntities((prev) => {
      const next = new Set(prev);
      if (next.has(entityId)) {
        next.delete(entityId);
      } else {
        next.add(entityId);
      }
      return next;
    });
  };

  return (
    <div className="w-full">
      <div className="p-4 space-y-6">
        <div>
          <h3 className="font-medium mb-2">
            Entity Distribution ({sortedEntities.length} unique entities,{" "}
            {totalMentions} total mentions)
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium mb-2">By Discourse Role</h4>
              <div className="space-y-1">
                {Array.from(discourseRoleCounts.entries()).map(
                  ([role, count]) => (
                    <div
                      key={role}
                      className="flex justify-between text-sm bg-gray-50 px-2 py-1 rounded"
                    >
                      <span className="capitalize">{role}</span>
                      <span className="text-gray-600">{count}</span>
                    </div>
                  )
                )}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">By Social Role</h4>
              <div className="space-y-1">
                {Array.from(socialRoleCounts.entries()).map(([role, count]) => (
                  <div
                    key={role}
                    className="flex justify-between text-sm bg-gray-50 px-2 py-1 rounded"
                  >
                    <span className="capitalize">{role}</span>
                    <span className="text-gray-600">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-medium mb-2">Key Entities and Their Context</h3>
          <div className="space-y-4">
            {(showAllEntities
              ? sortedEntities
              : sortedEntities.slice(0, 10)
            ).map(({ entity, frequency, mentions }) => (
              <div key={entity.id} className="bg-gray-50 p-3 rounded-lg">
                <div
                  className="flex justify-between items-start mb-2 cursor-pointer"
                  onClick={() => toggleEntity(entity.id)}
                >
                  <div className="flex items-center gap-2">
                    <button
                      className="w-5 h-5 rounded border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleEntity(entity.id);
                      }}
                    >
                      {expandedEntities.has(entity.id) ? "−" : "+"}
                    </button>
                    <div>
                      <span className="font-medium">{entity.name}</span>
                      <div className="text-sm text-gray-600">
                        {entity.discourse_role} • {entity.social_role}
                      </div>
                    </div>
                  </div>
                  <span className="text-sm bg-gray-200 px-2 py-1 rounded">
                    {frequency} mentions
                  </span>
                </div>
                {expandedEntities.has(entity.id) && (
                  <div className="space-y-2 mt-3">
                    {mentions.map((mention, idx) => (
                      <div
                        key={idx}
                        className="text-sm bg-white p-2 rounded border border-gray-100"
                      >
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>{mention.date}</span>
                          <span className="flex items-center gap-1">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                mention.sentiment.polarity === "positive"
                                  ? "bg-green-400"
                                  : mention.sentiment.polarity === "negative"
                                  ? "bg-red-400"
                                  : "bg-gray-400"
                              }`}
                            />
                            {mention.topic}
                          </span>
                        </div>
                        <p className="text-gray-700">{mention.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          {sortedEntities.length > 10 && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => setShowAllEntities(!showAllEntities)}
                className="group relative inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
              >
                {showAllEntities ? (
                  <>
                    Show Less
                    <svg
                      className="w-4 h-4 transition-transform group-hover:-translate-y-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 15l7-7 7 7"
                      />
                    </svg>
                  </>
                ) : (
                  <>
                    Show {sortedEntities.length - 10} More Entities
                    <svg
                      className="w-4 h-4 transition-transform group-hover:translate-y-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
