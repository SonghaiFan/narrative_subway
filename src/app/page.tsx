"use client";

import { TimeDisplay } from "@/components/narrative-time/time-display";
import { EntityDisplay } from "@/components/narrative-entity/entity-display";
import { TopicDisplay } from "@/components/narrative-topic/topic-display";
import { ProfileSection } from "@/components/profile-section";
import { ResizableGrid } from "@/components/shared/resizable-grid";
import { useEffect, useState } from "react";
import { TimelineData } from "@/types/article";

export default function Home() {
  const [data, setData] = useState<TimelineData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/narrative");
        if (!response.ok) {
          throw new Error("Failed to fetch narrative data");
        }
        const timelineData = await response.json();
        setData(timelineData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
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
            author={metadata.author}
            publishDate={metadata.publishDate}
            imageUrl={metadata.imageUrl}
            events={events}
          />
        )}
        topRight={renderPanel(
          <TopicDisplay events={events} selectedEventId={undefined} />
        )}
        bottomLeft={renderPanel(<EntityDisplay events={events} />)}
        bottomRight={renderPanel(
          <TimeDisplay events={events} selectedEventId={undefined} />
        )}
      />
    </div>
  );
}
