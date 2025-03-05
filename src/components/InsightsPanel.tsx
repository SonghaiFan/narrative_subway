import React from "react";

interface InsightsPanelProps {
  activeTab: "visual" | "text";
  moduleId: "entity" | "time" | "topic";
  moduleInfo: {
    title: string;
  };
}

function InsightsPanel({
  activeTab,
  moduleId,
  moduleInfo,
}: InsightsPanelProps) {
  return (
    <div className="h-full overflow-auto">
      <h2 className="text-sm font-medium mb-2">
        {activeTab === "visual"
          ? "Visualization Insights"
          : "Text Analysis Insights"}
      </h2>
      <div className="prose max-w-none text-xs">
        {activeTab === "visual" ? (
          <>
            <p className="text-gray-600">
              This visualization represents the {moduleInfo.title.toLowerCase()}{" "}
              of the narrative, showing how{" "}
              {moduleId === "entity"
                ? "entities and their relationships"
                : moduleId === "time"
                ? "events unfold over time"
                : "themes and topics evolve"}{" "}
              throughout the story.
            </p>
            <h3 className="text-xs font-medium mt-3 mb-1">Key Insights:</h3>
            <ul className="space-y-1 text-gray-600">
              {moduleId === "entity" && (
                <>
                  <li>
                    Identify key actors and their relationships within the
                    narrative
                  </li>
                  <li>
                    Analyze how different entities are represented and
                    characterized
                  </li>
                  <li>
                    Understand the network of relationships between different
                    roles
                  </li>
                </>
              )}
              {moduleId === "time" && (
                <>
                  <li>
                    Track the sequence of events as they unfold chronologically
                  </li>
                  <li>Identify patterns in temporal structures and rhythms</li>
                  <li>
                    Analyze how time is compressed, expanded, or reordered in
                    the narrative
                  </li>
                </>
              )}
              {moduleId === "topic" && (
                <>
                  <li>
                    Discover dominant themes and their evolution throughout the
                    narrative
                  </li>
                  <li>
                    Track emotional tones and their shifts across different
                    segments
                  </li>
                  <li>Identify thematic clusters and their relationships</li>
                </>
              )}
            </ul>
          </>
        ) : (
          <>
            <p className="text-gray-600">
              This text analysis breaks down the{" "}
              {moduleInfo.title.toLowerCase()} of the narrative, providing
              detailed insights into{" "}
              {moduleId === "entity"
                ? "characters, objects, and their attributes"
                : moduleId === "time"
                ? "chronology, duration, and temporal patterns"
                : "thematic elements, motifs, and emotional tones"}
              .
            </p>
            <h3 className="text-xs font-medium mt-3 mb-1">
              Analysis Approach:
            </h3>
            <p className="text-gray-600">
              Our analysis combines computational methods with narrative theory
              to extract meaningful patterns from the text. We identify{" "}
              {moduleId === "entity"
                ? "entities using named entity recognition and coreference resolution"
                : moduleId === "time"
                ? "temporal expressions and event sequences through temporal tagging"
                : "themes and topics using semantic clustering and sentiment analysis"}
              .
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default InsightsPanel;
