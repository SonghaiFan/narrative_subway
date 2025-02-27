"use client";

import { TimeDisplay } from "@/components/narrative-time/time-display";
import { EntityDisplay } from "@/components/narrative-entity/entity-display";
import { TopicDisplay } from "@/components/narrative-topic/topic-display";
import { ProfileSection } from "@/components/profile-section";
import { ResizableGrid } from "@/components/ui/resizable-grid";
import { useCallback, useEffect, useState } from "react";
import { TimelineData } from "@/types/article";

export default function Home() {
  const [data, setData] = useState<TimelineData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (fileName: string = "data.json") => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDataChange = useCallback((newData: TimelineData) => {
    setData(newData);
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error || !data) {
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
            onDataChange={handleDataChange}
          />
        )}
        topRight={renderPanel(
          <TopicDisplay events={events} selectedEventId={undefined} />
        )}
        bottomLeft={renderPanel(<EntityDisplay events={events} />)}
        bottomRight={renderPanel(
          <TimeDisplay
            events={events}
            selectedEventId={undefined}
            metadata={metadata}
          />
        )}
      />
    </div>
  );
}
