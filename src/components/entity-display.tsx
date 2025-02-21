"use client";

import { TimelineEvent } from "@/types/article";
import { useState } from "react";
import { EntityTextSummary } from "./entity-text-summary";
import { EntityVisualOverview } from "./entity-visual-overview";

interface EntityDisplayProps {
  events?: TimelineEvent[];
}

type ViewMode = "visual" | "text";

export function EntityDisplay({ events = [] }: EntityDisplayProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("visual");

  if (!events.length) {
    return (
      <div className="p-6 h-full flex flex-col items-center justify-center">
        <p className="text-gray-500">No events data available</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
        <h2 className="text-lg font-bold">Entity Timeline</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("visual")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              viewMode === "visual"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            Visual
          </button>
          <button
            onClick={() => setViewMode("text")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              viewMode === "text"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            Text
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        {viewMode === "visual" ? (
          <EntityVisualOverview events={events} />
        ) : (
          <EntityTextSummary events={events} />
        )}
      </div>
    </div>
  );
}
