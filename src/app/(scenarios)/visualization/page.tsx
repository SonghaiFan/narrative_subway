"use client";

import { TimeDisplay } from "@/components/features/narrative/time/time-display";
import { EntityDisplay } from "@/components/features/narrative/entity/entity-display";
import { TopicDisplay } from "@/components/features/narrative/topic/topic-display";
import { PureTextDisplay } from "@/components/features/narrative/pure-text/pure-text-display";
import { TaskPanel } from "@/components/features/task/task-panel";
import { ResizableGrid } from "@/components/ui/resizable-layout/resizable-grid";
import { useState, useEffect } from "react";
import { useCenterControl } from "@/contexts/center-control-context";
import { useAuth } from "@/contexts/auth-context";
import { ScenarioLayout } from "@/components/layouts/scenario-layout";

function VisualizationScenario() {
  const {
    data,
    setData,
    isLoading,
    setIsLoading,
    error,
    setError,
    selectedEventId,
    setSelectedEventId,
  } = useCenterControl();
  const { user } = useAuth();
  const [availableFiles, setAvailableFiles] = useState<string[]>([]);

  // Fetch available data files
  useEffect(() => {
    const fetchAvailableFiles = async () => {
      try {
        const response = await fetch("/api/data-files");
        if (!response.ok) {
          throw new Error("Failed to fetch available data files");
        }
        const files = await response.json();
        setAvailableFiles(files);
      } catch (error) {
        console.error("Failed to fetch available data files:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Failed to fetch available data files"
        );
      }
    };

    fetchAvailableFiles();
  }, [setError]);

  // Fetch data function
  const fetchData = async (fileName?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Default to the first file if none specified
      const fileToFetch =
        fileName ||
        (availableFiles.length > 0 ? availableFiles[0] : "data_Israel.json");

      const response = await fetch(`/${fileToFetch}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${fileToFetch}`);
      }

      const data = await response.json();
      setData(data);
    } catch (error) {
      console.error("Failed to load data:", error);
      setError(error instanceof Error ? error.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    if (!data && availableFiles.length > 0) {
      fetchData(availableFiles[0]);
    }
  }, [data, availableFiles]);

  // Show error state
  if (error) {
    return (
      <ScenarioLayout title="Text + Visualization " isLoading={false}>
        <div className="h-full flex flex-col items-center justify-center p-4">
          <div className="text-red-500 mb-2">Error:</div>
          <div className="text-gray-700 mb-4 text-center max-w-md">
            {error || "Failed to load data"}
          </div>
          <button
            onClick={() => fetchData()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </ScenarioLayout>
    );
  }

  // If no data yet, show a placeholder
  if (!data || !data.events) {
    return (
      <ScenarioLayout title="Text + Visualization " isLoading={true}>
        <div className="h-full flex items-center justify-center">
          <div className="text-gray-500">Loading content...</div>
        </div>
      </ScenarioLayout>
    );
  }

  const { metadata, events } = data;

  const renderPanel = (content: React.ReactNode) => (
    <div className="h-full bg-white border border-gray-200 shadow-sm">
      <div className="h-full overflow-auto">{content}</div>
    </div>
  );

  return (
    <ScenarioLayout title="Text + Visualization " isLoading={isLoading}>
      <div className="w-full h-full overflow-hidden relative grid grid-cols-1 md:grid-cols-4 gap-4 p-4">
        <div className="md:col-span-3 h-full">
          <ResizableGrid
            topLeft={renderPanel(<PureTextDisplay events={events} />)}
            topRight={renderPanel(<TopicDisplay events={events} />)}
            bottomLeft={renderPanel(<EntityDisplay events={events} />)}
            bottomRight={renderPanel(
              <TimeDisplay events={events} metadata={metadata} />
            )}
          />
        </div>
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <TaskPanel
            events={events}
            metadata={metadata}
            userRole={user?.role as "domain" | "normal"}
          />
        </div>
      </div>
    </ScenarioLayout>
  );
}

export default function VisualizationPage() {
  return <VisualizationScenario />;
}
