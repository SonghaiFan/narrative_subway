"use client";

import { ReactNode } from "react";

interface VisualizationDisplayProps {
  title: string;
  viewMode: "visual" | "text";
  setViewMode: (mode: "visual" | "text") => void;
  children: ReactNode;
  isEmpty?: boolean;
  headerContent?: ReactNode;
}

export function VisualizationDisplay({
  title,
  viewMode,
  setViewMode,
  children,
  isEmpty = false,
  headerContent,
}: VisualizationDisplayProps) {
  if (isEmpty) {
    return (
      <div className="p-6 h-full flex flex-col items-center justify-center">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-medium text-gray-600">{title}</h2>
          {headerContent}
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setViewMode("visual")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              viewMode === "visual"
                ? "bg-gray-900 text-white"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Visual
          </button>
          <button
            onClick={() => setViewMode("text")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              viewMode === "text"
                ? "bg-gray-900 text-white"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Text
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
