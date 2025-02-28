"use client";

import { TimeDisplay } from "@/components/narrative-time/time-display";
import { EntityDisplay } from "@/components/narrative-entity/entity-display";
import { TopicDisplay } from "@/components/narrative-topic/topic-display";
import { ProfileSection } from "@/components/profile-section";
import { ResizableGrid } from "@/components/ui/resizable-grid";
import { useCallback, useEffect } from "react";
import {
  CenterControlProvider,
  useCenterControl,
} from "@/lib/center-control-context";
import { TooltipProvider } from "@/lib/tooltip-context";

// Main content component that uses the context
function MainContent() {
  const {
    data,
    setData,
    isLoading,
    setIsLoading,
    error,
    setError,
    selectedEventId,
  } = useCenterControl();

  const fetchData = useCallback(
    async (fileName: string = "data.json") => {
      try {
        setIsLoading(true);
        const response = await fetch(`/${fileName}`);
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
      }
    },
    [setData, setError, setIsLoading]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading || !data) {
    return (
      <div className="h-screen w-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-500">{error || "Failed to load data"}</div>
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
    <div className="h-screen w-screen bg-gray-50">
      <ResizableGrid
        className="h-full"
        topLeft={renderPanel(
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
        )}
        topRight={renderPanel(
          <TopicDisplay events={events} selectedEventId={selectedEventId} />
        )}
        bottomLeft={renderPanel(<EntityDisplay events={events} />)}
        bottomRight={renderPanel(
          <TimeDisplay
            events={events}
            selectedEventId={selectedEventId}
            metadata={metadata}
          />
        )}
      />
    </div>
  );
}

// Wrapper component that provides the context
export default function Home() {
  return (
    <CenterControlProvider>
      <TooltipProvider>
        <MainContent />
      </TooltipProvider>
    </CenterControlProvider>
  );
}
