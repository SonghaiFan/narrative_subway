"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { TimeDisplay } from "@/components/narrative-time/time-display";
import { EntityDisplay } from "@/components/narrative-entity/entity-display";
import { TopicDisplay } from "@/components/narrative-topic/topic-display";

import {
  CenterControlProvider,
  useCenterControl,
} from "@/lib/center-control-context";
import { TooltipProvider } from "@/lib/tooltip-context";
import InsightsPanel from "@/components/InsightsPanel";

// Module configuration
const moduleConfig = {
  entity: {
    title: "Entity Dimension",
    description:
      "Exploring focus roles, relationships, and representations within narratives",
    component: EntityDisplay,
  },
  time: {
    title: "Time Dimension",
    description:
      "Analyzing event sequences and temporal structures in narratives",
    component: TimeDisplay,
  },
  topic: {
    title: "Theme Dimension",
    description:
      "Discovering topics, emotions, and theme evolution across narratives",
    component: TopicDisplay,
  },
};

function VisualizationContent() {
  const searchParams = useSearchParams();
  const moduleId = searchParams.get("module") || "entity";
  const datasetId = searchParams.get("dataset") || "data.json";

  const { data, setData, isLoading, setIsLoading, error, setError } =
    useCenterControl();
  const [activeTab, setActiveTab] = useState<"visual" | "text">("visual");
  const [datasetTitle, setDatasetTitle] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/data/${datasetId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch /data/${datasetId}`);
      }
      const timelineData = await response.json();
      setData(timelineData);

      // Set dataset title from metadata if available
      if (timelineData.metadata && timelineData.metadata.title) {
        setDatasetTitle(timelineData.metadata.title);
      } else {
        // Fallback to formatted filename
        setDatasetTitle(formatDatasetName(datasetId));
      }

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [datasetId, setData, setError, setIsLoading]);

  // Format dataset name from filename
  const formatDatasetName = (filename: string) => {
    // Fallback to filename-based naming
    if (filename === "data.json") return "Gaza-Israel Conflict";
    if (filename === "data_Israel.json") return "Israel Perspective";

    // Remove extension and format
    return filename.replace(".json", "").replace(/_/g, " ");
  };

  // Truncate long text for display
  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength
      ? text.substring(0, maxLength - 3) + "..."
      : text;
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading || !data) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="text-sm text-red-500">
          {error || "Failed to load data"}
        </div>
      </div>
    );
  }

  const { metadata, events } = data;
  const moduleInfo = moduleConfig[moduleId as keyof typeof moduleConfig];
  const ModuleComponent = moduleInfo.component;

  return (
    <div className="flex flex-col min-h-screen h-screen bg-white">
      {/* Header - Minimalist */}
      <header className="border-b border-gray-100 py-3">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
            <div className="flex items-center">
              <Link href="/" className="text-gray-400 hover:text-gray-600 mr-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>
              <h1 className="text-base font-medium text-gray-900 truncate">
                {moduleInfo.title}
              </h1>
            </div>
            <div className="mt-1 sm:mt-0">
              <p className="text-xs text-gray-500">
                Dataset:{" "}
                <span className="max-w-[200px] inline-block truncate align-bottom">
                  {datasetTitle}
                </span>
              </p>
            </div>
          </div>
          <p className="mt-1 text-xs text-gray-500 line-clamp-1">
            {moduleInfo.description}
          </p>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow overflow-auto">
        <div className="max-w-5xl mx-auto px-4 py-4 h-full flex flex-col">
          {/* Tabs */}
          <div className="mb-3 border-b border-gray-100">
            <div className="flex space-x-6">
              <button
                onClick={() => setActiveTab("visual")}
                className={`py-2 px-1 border-b-2 text-xs font-medium ${
                  activeTab === "visual"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200"
                }`}
              >
                Visualization
              </button>
              <button
                onClick={() => setActiveTab("text")}
                className={`py-2 px-1 border-b-2 text-xs font-medium ${
                  activeTab === "text"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200"
                }`}
              >
                Text Analysis
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-md border border-gray-100 overflow-hidden flex-grow">
            <div className="p-3 h-full">
              <div className="grid grid-cols-1 gap-4 h-full">
                {/* Top: Visualization or Text */}
                <div className="min-h-[300px] flex items-center justify-center border border-gray-100 rounded-md p-3">
                  <ModuleComponent
                    events={events}
                    metadata={metadata}
                    activeTab={activeTab}
                  />
                </div>

                {/* Bottom: Description and Analysis */}
                <InsightsPanel
                  activeTab={activeTab}
                  moduleId={moduleId as "entity" | "time" | "topic"}
                  moduleInfo={moduleInfo}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer - Minimalist */}
      <footer className="border-t border-gray-100 py-2">
        <div className="max-w-5xl mx-auto px-4">
          <p className="text-center text-xs text-gray-400">
            © 2023 Narrative Subway. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function VisualizationPage() {
  return (
    <CenterControlProvider>
      <TooltipProvider>
        <VisualizationContent />
      </TooltipProvider>
    </CenterControlProvider>
  );
}
