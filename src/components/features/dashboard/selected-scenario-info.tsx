"use client";

import { useCenterControl } from "@/contexts/center-control-context";
import { ScenarioType } from "./scenario-selector";

interface ScenarioInfo {
  title: string;
  description: string;
  icon: string;
}

export function SelectedScenarioInfo() {
  const { selectedScenario } = useCenterControl();

  if (!selectedScenario) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-gray-200">
        <div className="flex items-center">
          <div className="flex-shrink-0 text-2xl">🔍</div>
          <div className="ml-4">
            <h3 className="text-sm font-medium text-gray-700">
              No Scenario Selected
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Select a scenario from the grid to see more information
            </p>
          </div>
        </div>
      </div>
    );
  }

  const scenarioInfo: Record<ScenarioType, ScenarioInfo> = {
    "pure-text": {
      title: "Text Analysis",
      description: "Analyze narrative structures in text-only format",
      icon: "📝",
    },
    visualization: {
      title: "Data Visualization",
      description:
        "Explore narrative patterns through interactive visualizations",
      icon: "📊",
    },
    "pure-text-chat": {
      title: "Text Chat Analysis",
      description: "Analyze narrative structures in conversational formats",
      icon: "💬",
    },
    "visualization-chat": {
      title: "Visual Chat Analysis",
      description: "Explore narrative patterns in visual conversations",
      icon: "🔍",
    },
  };

  const info = scenarioInfo[selectedScenario];

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
      <div className="flex items-center">
        <div className="flex-shrink-0 text-2xl">{info.icon}</div>
        <div className="ml-4">
          <h3 className="text-sm font-medium text-gray-900">{info.title}</h3>
          <p className="text-xs text-gray-500 mt-1">{info.description}</p>
        </div>
      </div>
      <div className="mt-3 text-xs">
        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
          Selected
        </span>
      </div>
    </div>
  );
}
