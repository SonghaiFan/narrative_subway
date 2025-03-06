"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCenterControl } from "@/lib/center-control-context";

export type ScenarioType =
  | "pure-text"
  | "visualization"
  | "pure-text-chat"
  | "visualization-chat";

interface ScenarioCardProps {
  title: string;
  description: string;
  imageSrc: string;
  onClick: () => void;
  isSelected: boolean;
}

function ScenarioCard({
  title,
  description,
  imageSrc,
  onClick,
  isSelected,
}: ScenarioCardProps) {
  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-lg border transition-all cursor-pointer bg-white ${
        isSelected
          ? "border-blue-500 ring-2 ring-blue-500 shadow-md"
          : "border-gray-200 hover:border-gray-300 hover:shadow"
      }`}
      onClick={onClick}
    >
      <div className="p-3">
        <div className="bg-gray-100 rounded-lg overflow-hidden mb-2 h-28">
          <Image
            src={imageSrc}
            alt={title}
            width={400}
            height={200}
            className="w-full h-full object-cover"
          />
        </div>
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">
          {description}
        </p>
      </div>
    </div>
  );
}

export function ScenarioSelector() {
  const [selectedScenario, setSelectedScenario] = useState<ScenarioType | null>(
    null
  );
  const router = useRouter();
  const { data, setData } = useCenterControl();
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial data if not already loaded
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!data) {
        try {
          setIsLoading(true);
          const response = await fetch("/data_Israel.json");
          if (!response.ok) {
            throw new Error("Failed to fetch data");
          }
          const timelineData = await response.json();
          setData(timelineData);
        } catch (error) {
          console.error("Failed to load initial data:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [data, setData]);

  const handleScenarioSelect = (scenario: ScenarioType) => {
    setSelectedScenario(scenario);
  };

  const handleContinue = () => {
    if (selectedScenario) {
      router.push(`/scenario/${selectedScenario}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-3 border-neutral-300 border-t-neutral-600 rounded-full animate-spin mb-2"></div>
        <div className="text-neutral-600 text-sm">Loading data...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-neutral-500 text-sm">No data available</div>
      </div>
    );
  }

  const { metadata } = data;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-2 px-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-semibold">Scenario Selection</h1>
            <a href="#" className="text-blue-600 text-xs">
              Back to Scenario Selection
            </a>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">Domain Expert</span>
            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 text-sm">
              D
            </div>
          </div>
        </div>
      </header>

      {/* Article Info */}
      <div className="border-b border-gray-200 bg-white py-2">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">War</span>
                <span className="text-xs text-gray-500">Nov 20</span>
              </div>
              <h2 className="text-lg font-bold">{metadata.title}</h2>
              <p className="text-xs text-gray-600">By {metadata.author}</p>
            </div>
            <div className="flex items-center">
              <select className="border border-gray-300 rounded-md text-xs py-1 px-2">
                <option>data_Israel.json</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto px-4 py-4">
        <div className="mb-3">
          <h2 className="text-lg font-bold text-gray-900">
            Choose a Visualization Mode
          </h2>
          <p className="text-xs text-gray-500">
            Select how you'd like to explore the narrative data
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Standard Views */}
          <div>
            <h3 className="text-xs font-medium text-gray-500 mb-2">
              Standard Views
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <ScenarioCard
                title="Pure Text View"
                description="Display events in narrative order like a normal news article."
                imageSrc="/images/pure-text-preview.svg"
                onClick={() => handleScenarioSelect("pure-text")}
                isSelected={selectedScenario === "pure-text"}
              />
              <ScenarioCard
                title="Visualization View"
                description="Interactive visualization with topic flow, entity relationships, and timeline views."
                imageSrc="/images/visualization-preview.svg"
                onClick={() => handleScenarioSelect("visualization")}
                isSelected={selectedScenario === "visualization"}
              />
            </div>
          </div>

          {/* AI-Powered Views */}
          <div>
            <div className="flex items-center mb-2">
              <h3 className="text-xs font-medium text-gray-500">
                AI-Powered Views
              </h3>
              <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-800">
                AI Assistant
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <ScenarioCard
                title="Pure Text + AI Chat"
                description="Text view with an AI assistant that can answer questions about the narrative."
                imageSrc="/images/pure-text-preview.svg"
                onClick={() => handleScenarioSelect("pure-text-chat")}
                isSelected={selectedScenario === "pure-text-chat"}
              />
              <ScenarioCard
                title="Visualization + AI Chat"
                description="Interactive visualizations with an AI assistant to help interpret the data."
                imageSrc="/images/visualization-preview.svg"
                onClick={() => handleScenarioSelect("visualization-chat")}
                isSelected={selectedScenario === "visualization-chat"}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Footer with Continue Button */}
      <footer className="bg-white border-t border-gray-200 py-2 px-4 mt-auto">
        <div className="max-w-5xl mx-auto flex justify-end">
          <button
            type="button"
            className={`rounded-md px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-all ${
              selectedScenario
                ? "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                : "bg-gray-300 cursor-not-allowed"
            }`}
            disabled={!selectedScenario}
            onClick={handleContinue}
          >
            Continue
          </button>
        </div>
      </footer>
    </div>
  );
}
