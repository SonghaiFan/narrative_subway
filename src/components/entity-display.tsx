import { Entity, TimelineEvent } from "@/types/article";

interface EntityDisplayProps {
  events?: TimelineEvent[];
}

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

export function EntityDisplay({ events = [] }: EntityDisplayProps) {
  // Early return if no events
  if (!events || events.length === 0) {
    return (
      <div className="p-6 h-full flex flex-col items-center justify-center">
        <p className="text-gray-500">No events data available</p>
      </div>
    );
  }

  // Build rich entity context
  const entityContextMap = new Map<string, EntityContext>();

  events.forEach((event) => {
    if (!event?.entities) return;

    event.entities.forEach((entity) => {
      if (!entity?.id || !entity?.name) return;

      const existingContext = entityContextMap.get(entity.id) || {
        id: entity.id,
        entity,
        frequency: 0,
        mentions: [],
      };

      existingContext.frequency += 1;
      existingContext.mentions.push({
        text: event.text,
        date:
          event.temporal_anchoring?.real_time ||
          event.temporal_anchoring?.anchor ||
          "Unknown date",
        topic: event.topic.main_topic,
        sentiment: event.topic.sentiment,
      });

      entityContextMap.set(entity.id, existingContext);
    });
  });

  const sortedEntities = Array.from(entityContextMap.values()).sort(
    (a, b) => b.frequency - a.frequency
  );

  if (sortedEntities.length === 0) {
    return (
      <div className="p-6 h-full flex flex-col items-center justify-center">
        <p className="text-gray-500">No entity data found in events</p>
      </div>
    );
  }

  // Calculate role type and social role distributions
  const roleTypeCounts = new Map<string, number>();
  const socialRoleCounts = new Map<string, number>();

  sortedEntities.forEach(({ entity }) => {
    if (entity.role_type) {
      roleTypeCounts.set(
        entity.role_type,
        (roleTypeCounts.get(entity.role_type) || 0) + 1
      );
    }
    if (entity.social_role) {
      socialRoleCounts.set(
        entity.social_role,
        (socialRoleCounts.get(entity.social_role) || 0) + 1
      );
    }
  });

  return (
    <div className="p-6 h-full flex flex-col overflow-auto">
      <h2 className="text-lg font-bold mb-4">Entity Analysis</h2>
      <div className="space-y-6">
        <div>
          <h3 className="font-medium mb-2">
            Entity Distribution ({sortedEntities.length} total)
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium mb-2">By Role Type</h4>
              <div className="space-y-1">
                {Array.from(roleTypeCounts.entries()).map(([role, count]) => (
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
            {sortedEntities
              .slice(0, 5)
              .map(({ entity, frequency, mentions }) => (
                <div key={entity.id} className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-medium">{entity.name}</span>
                      <div className="text-sm text-gray-600">
                        {entity.role_type} • {entity.social_role}
                      </div>
                    </div>
                    <span className="text-sm bg-gray-200 px-2 py-1 rounded">
                      {frequency} mentions
                    </span>
                  </div>
                  <div className="space-y-2">
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
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
