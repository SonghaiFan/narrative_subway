/**
 * Unified scenario type definition for the application
 * This is used across different components to ensure consistency
 */
export type ScenarioType =
  | "pure-text" // Text-only view
  | "text-visual" // Text with visualizations
  | "text-chat" // Text with AI chat
  | "mixed"; // Mixed view with visualizations and AI chat

// Map for converting between different naming conventions if needed
export const scenarioTypeMap: Record<string, ScenarioType> = {
  "pure-text": "pure-text",
  "text-visual": "text-visual",
  "text-chat": "text-chat",
  mixed: "mixed",
  "pure-text-chat": "text-chat", // Legacy mapping
  "visualization-chat": "mixed", // Legacy mapping
};
