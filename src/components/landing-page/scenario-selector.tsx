"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ProfileSection } from "@/components/profile-section";
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
      className={`relative flex flex-col overflow-hidden rounded-lg border transition-all cursor-pointer ${
        isSelected
          ? "border-blue-500 ring-2 ring-blue-500 shadow-md"
          : "border-gray-200 hover:border-gray-300 hover:shadow"
      }`}
      onClick={onClick}
    >
      <div className="relative h-36 w-full overflow-hidden bg-gray-100">
        <Image src={imageSrc} alt={title} fill className="object-cover" />
      </div>
      <div className="flex flex-1 flex-col justify-between p-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="mt-2 text-sm text-gray-500 line-clamp-3">
            {description}
          </p>
        </div>
        {isSelected && (
          <div className="mt-3">
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
              Selected
            </span>
          </div>
        )}
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
        <div className="w-16 h-16 border-4 border-neutral-300 border-t-neutral-600 rounded-full animate-spin mb-4"></div>
        <div className="text-neutral-600 font-medium">Loading data...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-neutral-500">No data available</div>
      </div>
    );
  }

  const { metadata, events } = data;

  return (
    <div className="h-screen w-screen bg-gray-50 overflow-hidden">
      <div className="h-full w-full p-4 flex items-stretch">
        <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row lg:gap-6">
          {/* Left column - Profile Section */}
          <div className="flex-1 bg-white rounded-lg shadow-sm overflow-hidden mb-4 lg:mb-0">
            <div className="h-full overflow-auto">
              <ProfileSection
                title={metadata.title}
                description={metadata.description}
                topic={metadata.topic}
                author={metadata.author}
                publishDate={metadata.publishDate}
                imageUrl={metadata.imageUrl}
                events={events}
                onDataChange={setData}
              />
            </div>
          </div>

          {/* Right column - Scenario Selection */}
          <div className="flex-1 grid grid-rows-[auto_1fr_auto] h-full">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold tracking-tight text-gray-900">
                Choose a Visualization Mode
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Select how you'd like to explore the narrative data
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-auto p-1">
              {/* Standard Modes */}
              <div className="space-y-4">
                <div className="text-sm font-medium text-gray-500 pl-2">
                  Standard Views
                </div>
                <ScenarioCard
                  title="Pure Text View"
                  description="Display events in narrative order like a normal news article. Simple and straightforward reading experience."
                  imageSrc="/images/pure-text-preview.svg"
                  onClick={() => handleScenarioSelect("pure-text")}
                  isSelected={selectedScenario === "pure-text"}
                />
                <ScenarioCard
                  title="Visualization View"
                  description="Interactive visualization with topic flow, entity relationships, and timeline views. Ideal for data exploration."
                  imageSrc="/images/visualization-preview.svg"
                  onClick={() => handleScenarioSelect("visualization")}
                  isSelected={selectedScenario === "visualization"}
                />
              </div>

              {/* AI-Powered Modes */}
              <div className="space-y-4">
                <div className="text-sm font-medium text-gray-500 pl-2 flex items-center">
                  <span>AI-Powered Views</span>
                  <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                    AI Assistant
                  </span>
                </div>
                <ScenarioCard
                  title="Pure Text + AI Chat"
                  description="Text view with an AI assistant that can answer questions about the narrative and provide additional context."
                  imageSrc="/images/pure-text-preview.svg"
                  onClick={() => handleScenarioSelect("pure-text-chat")}
                  isSelected={selectedScenario === "pure-text-chat"}
                />
                <ScenarioCard
                  title="Visualization + AI Chat"
                  description="Interactive visualizations with an AI assistant to help interpret the data and answer questions about the narrative."
                  imageSrc="/images/visualization-preview.svg"
                  onClick={() => handleScenarioSelect("visualization-chat")}
                  isSelected={selectedScenario === "visualization-chat"}
                />
              </div>
            </div>

            <div className="mt-4 flex justify-center">
              <button
                type="button"
                className={`rounded-md px-5 py-2 text-sm font-medium text-white shadow-sm transition-all ${
                  selectedScenario
                    ? "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    : "bg-gray-300 cursor-not-allowed"
                }`}
                disabled={!selectedScenario}
                onClick={handleContinue}
              >
                Continue with Selected Scenario
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
