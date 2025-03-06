"use client";

import { TimeDisplay } from "@/components/narrative-time/time-display";
import { EntityDisplay } from "@/components/narrative-entity/entity-display";
import { TopicDisplay } from "@/components/narrative-topic/topic-display";
import { PureTextDisplay } from "@/components/narrative-pure-text/pure-text-display";
import { ChatInterface } from "@/components/chat/chat-interface";
import { ResizableGrid } from "@/components/ui/resizable-grid";
import { useCallback, useEffect, useState } from "react";
import {
  CenterControlProvider,
  useCenterControl,
} from "@/lib/center-control-context";
import { TooltipProvider } from "@/lib/tooltip-context";
import Link from "next/link";

function VisualizationChatScenario() {
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
  const [availableFiles, setAvailableFiles] = useState<string[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

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

  const fetchData = useCallback(
    async (fileName?: string) => {
      try {
        setIsLoading(true);

        // If no fileName is provided and we have available files, use the first one
        if (!fileName && availableFiles.length > 0) {
          // Try to find the first non-archived file
          const nonArchivedFile = availableFiles.find(
            (file) => !file.startsWith("archived/")
          );
          fileName = nonArchivedFile || availableFiles[0];
        }

        // Fallback to data.json if still no fileName
        fileName = fileName || "data.json";

        // Handle paths correctly - if the file is in the archived directory
        const filePath = fileName.startsWith("archived/")
          ? fileName // Keep the path as is
          : fileName; // No path prefix needed

        const response = await fetch(`/${filePath}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${fileName}`);
        }
        const timelineData = await response.json();
        setData(timelineData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
        setIsInitialLoading(false);
      }
    },
    [setData, setError, setIsLoading, availableFiles]
  );

  // Load data when available files are fetched
  useEffect(() => {
    if (availableFiles.length > 0) {
      fetchData();
    }
  }, [availableFiles, fetchData]);

  if (isInitialLoading) {
    return (
      <div className="h-screen w-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-neutral-300 border-t-neutral-600 rounded-full animate-spin mb-4"></div>
        <div className="text-neutral-600 font-medium">
          Loading data files...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="text-red-500 mb-2 text-xl">⚠️ Error</div>
        <div className="text-red-500 max-w-md text-center p-4 bg-red-50 rounded-md border border-red-200">
          {error || "Failed to load data"}
        </div>
        <button
          onClick={() => fetchData()}
          className="mt-4 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-md text-sm font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="h-screen w-screen bg-gray-50 flex items-center justify-center">
        <div className="text-neutral-500">No data available</div>
      </div>
    );
  }

  const { metadata, events } = data;

  const renderPanel = (content: React.ReactNode) => (
    <div className="h-full bg-white border border-gray-200 shadow-sm">
      <div className="h-full overflow-auto">{content}</div>
    </div>
  );

  return (
    <div className="h-screen w-screen bg-gray-50 overflow-hidden flex flex-col">
      {/* Header with back button */}
      <div className="bg-white shadow-sm z-10 px-4 py-2 flex justify-between items-center">
        <h1 className="text-lg font-semibold text-gray-900">
          Narrative Matrix - Visualization + AI Chat
        </h1>
        <Link
          href="/"
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          Back to Scenario Selection
        </Link>
      </div>

      {/* Loading overlay for file switching */}
      {isLoading && !isInitialLoading && (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-lg">
            <div className="w-10 h-10 border-4 border-neutral-300 border-t-neutral-600 rounded-full animate-spin mb-4"></div>
            <div className="text-neutral-700 font-medium">Loading data...</div>
          </div>
        </div>
      )}

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 overflow-hidden">
        {/* Left section: Visualizations */}
        <div className="lg:col-span-2 h-full">
          <ResizableGrid
            className="h-full"
            topLeft={renderPanel(
              <PureTextDisplay
                events={events}
                selectedEventId={selectedEventId}
                onEventSelect={setSelectedEventId}
              />
            )}
            topRight={renderPanel(<TopicDisplay events={events} />)}
            bottomLeft={renderPanel(<EntityDisplay events={events} />)}
            bottomRight={renderPanel(
              <TimeDisplay events={events} metadata={metadata} />
            )}
          />
        </div>

        {/* Right section: Chat Interface */}
        <div className="h-full overflow-hidden">
          <ChatInterface events={events} selectedEventId={selectedEventId} />
        </div>
      </div>
    </div>
  );
}

export default function VisualizationChatPage() {
  return (
    <CenterControlProvider>
      <TooltipProvider>
        <VisualizationChatScenario />
      </TooltipProvider>
    </CenterControlProvider>
  );
}
