"use client";

import { TimeDisplay } from "@/components/narrative-time/time-display";
import { EntityDisplay } from "@/components/narrative-entity/entity-display";
import { TopicAnalysis } from "@/components/topic-analysis";
import { ProfileSection } from "@/components/profile-section";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useEffect, useState } from "react";
import { TimelineData } from "@/types/article";

function ResizeHandle({
  className = "",
  id,
}: {
  className?: string;
  id: string;
}) {
  return (
    <PanelResizeHandle
      id={id}
      className={`flex justify-center items-center ${className}`}
    >
      <div className="w-1.5 h-full hover:bg-gray-300 transition-colors rounded-full bg-gray-200" />
    </PanelResizeHandle>
  );
}

export default function Home() {
  const [data, setData] = useState<TimelineData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/timeline");
        if (!response.ok) {
          throw new Error("Failed to fetch timeline data");
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

  return (
    <div className="h-screen w-screen bg-gray-50">
      <PanelGroup direction="vertical">
        <Panel defaultSize={30} minSize={20}>
          <PanelGroup direction="horizontal">
            <Panel defaultSize={30} minSize={20}>
              <div className="h-full bg-white border border-gray-200 shadow-sm">
                <ProfileSection
                  title={metadata.title}
                  description={metadata.description}
                  author={metadata.author}
                  publishDate={metadata.publishDate}
                  imageUrl={metadata.imageUrl}
                  events={events}
                />
              </div>
            </Panel>
            <ResizeHandle id="vertical-resize-1" />
            <Panel defaultSize={70}>
              <div className="h-full bg-white border border-gray-200 shadow-sm">
                <div className="h-full overflow-auto">
                  <TopicAnalysis events={events} />
                </div>
              </div>
            </Panel>
          </PanelGroup>
        </Panel>
        <ResizeHandle id="vertical-resize" className="mx-1" />
        <Panel defaultSize={70} minSize={30}>
          <PanelGroup direction="horizontal">
            <Panel defaultSize={30} minSize={20}>
              <div className="h-full bg-white border border-gray-200 shadow-sm">
                <div className="h-full overflow-auto">
                  <EntityDisplay events={events} />
                </div>
              </div>
            </Panel>
            <ResizeHandle id="vertical-resize-2" />
            <Panel defaultSize={70}>
              <div className="h-full bg-white border border-gray-200 shadow-sm">
                <div className="h-full overflow-auto">
                  <TimeDisplay events={events} selectedEventId={undefined} />
                </div>
              </div>
            </Panel>
          </PanelGroup>
        </Panel>
      </PanelGroup>
    </div>
  );
}
