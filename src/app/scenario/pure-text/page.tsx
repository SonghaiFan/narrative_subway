"use client";

import { PureTextDisplay } from "@/components/narrative-pure-text/pure-text-display";
import { useState, useEffect } from "react";
import {
  CenterControlProvider,
  useCenterControl,
} from "@/lib/center-control-context";
import { TooltipProvider } from "@/lib/tooltip-context";
import Link from "next/link";

function PureTextScenario() {
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

  // Fetch data function
  const fetchData = async (fileName?: string) => {
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
  };

  // Load data when available files are fetched
  useEffect(() => {
    if (availableFiles.length > 0) {
      fetchData();
    }
  }, [availableFiles]);

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

  const { events } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900">
            Narrative Matrix - Pure Text View
          </h1>
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Back to Scenario Selection
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <PureTextDisplay
            events={events}
            selectedEventId={selectedEventId}
            onEventSelect={setSelectedEventId}
          />
        </div>
      </main>
    </div>
  );
}

export default function PureTextPage() {
  return (
    <CenterControlProvider>
      <TooltipProvider>
        <PureTextScenario />
      </TooltipProvider>
    </CenterControlProvider>
  );
}
