"use client";

import { TimeDisplay } from "@/components/narrative-time/time-display";
import { EntityDisplay } from "@/components/narrative-entity/entity-display";
import { TopicAnalysis } from "@/components/topic-analysis";
import { ProfileSection } from "@/components/profile-section";
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
  ImperativePanelHandle,
} from "react-resizable-panels";
import { useCallback, useRef, useState, useEffect } from "react";

function ResizeHandle({
  className = "",
  isIntersection = false,
  isDragging = false,
}: {
  className?: string;
  isIntersection?: boolean;
  isDragging?: boolean;
}) {
  return (
    <PanelResizeHandle className={`${className} group/handle touch-none`}>
      {isIntersection ? (
        <div className="absolute z-20 w-4 h-4 -translate-x-1/2 -translate-y-1/2 bg-white border-2 border-gray-200 rounded-full cursor-move group-hover/handle:border-gray-400 group-data-[resize-handle-active]/handle:border-gray-400 transition-colors">
          <div className="absolute inset-0 rounded-full bg-red-500 opacity-0 group-hover/handle:opacity-100 group-data-[resize-handle-active]/handle:opacity-100 transition-opacity" />
        </div>
      ) : (
        <div
          className={`h-full w-1 bg-gray-200 rounded-full group-hover/handle:bg-gray-400 group-data-[resize-handle-active]/handle:bg-gray-400 transition-colors`}
        />
      )}
      {isDragging && <div className="fixed inset-0 bg-black/5 z-50" />}
    </PanelResizeHandle>
  );
}

interface ResizableLayoutProps {
  metadata: {
    title: string;
    description: string;
    author: string;
    publishDate: string;
    imageUrl: string;
  };
  events: any[];
}

export function ResizableLayout({ metadata, events }: ResizableLayoutProps) {
  const [isDragging, setIsDragging] = useState(false);
  const resizeTimeoutRef = useRef<NodeJS.Timeout>();

  // Refs for panels to track their sizes
  const topPanelRef = useRef<ImperativePanelHandle>(null);
  const bottomPanelRef = useRef<ImperativePanelHandle>(null);
  const leftTopPanelRef = useRef<ImperativePanelHandle>(null);
  const leftBottomPanelRef = useRef<ImperativePanelHandle>(null);

  // Handle resize start
  const handleResizeStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  // Handle resize end with debounced content update
  const handleResizeEnd = useCallback(() => {
    setIsDragging(false);

    // Clear any existing timeout
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
    }

    // Delay the content update
    resizeTimeoutRef.current = setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 100);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="h-screen w-screen bg-gray-50">
      <PanelGroup
        direction="vertical"
        onLayout={handleResizeEnd}
        onDragStart={handleResizeStart}
        onDragEnd={handleResizeEnd}
      >
        <Panel defaultSize={30} minSize={20} maxSize={50} ref={topPanelRef}>
          <PanelGroup
            direction="horizontal"
            onLayout={handleResizeEnd}
            onDragStart={handleResizeStart}
            onDragEnd={handleResizeEnd}
          >
            <Panel
              defaultSize={30}
              minSize={20}
              maxSize={50}
              ref={leftTopPanelRef}
            >
              <div
                className={`h-full bg-white border border-gray-200 shadow-sm transition-opacity duration-150 ${
                  isDragging ? "opacity-50" : ""
                }`}
              >
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
            <ResizeHandle isDragging={isDragging} />
            <Panel>
              <div
                className={`h-full bg-white border border-gray-200 shadow-sm transition-opacity duration-150 ${
                  isDragging ? "opacity-50" : ""
                }`}
              >
                <div className="h-full overflow-auto">
                  <TopicAnalysis events={events} />
                </div>
              </div>
            </Panel>
          </PanelGroup>
        </Panel>
        <ResizeHandle isIntersection isDragging={isDragging} />
        <Panel ref={bottomPanelRef}>
          <PanelGroup
            direction="horizontal"
            onLayout={handleResizeEnd}
            onDragStart={handleResizeStart}
            onDragEnd={handleResizeEnd}
          >
            <Panel
              defaultSize={30}
              minSize={20}
              maxSize={50}
              ref={leftBottomPanelRef}
            >
              <div
                className={`h-full bg-white border border-gray-200 shadow-sm transition-opacity duration-150 ${
                  isDragging ? "opacity-50" : ""
                }`}
              >
                <div className="h-full overflow-auto">
                  <EntityDisplay events={events} />
                </div>
              </div>
            </Panel>
            <ResizeHandle isDragging={isDragging} />
            <Panel>
              <div
                className={`h-full bg-white border border-gray-200 shadow-sm transition-opacity duration-150 ${
                  isDragging ? "opacity-50" : ""
                }`}
              >
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
