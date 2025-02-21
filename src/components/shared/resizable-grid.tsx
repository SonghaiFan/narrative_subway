"use client";

import { useState, useRef } from "react";
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
  ImperativePanelGroupHandle,
} from "react-resizable-panels";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUpDownLeftRight } from "@fortawesome/free-solid-svg-icons";

interface ResizableGridProps {
  topLeft: React.ReactNode;
  topRight: React.ReactNode;
  bottomLeft: React.ReactNode;
  bottomRight: React.ReactNode;
  className?: string;
}

export function ResizableGrid({
  topLeft,
  topRight,
  bottomLeft,
  bottomRight,
  className = "",
}: ResizableGridProps) {
  // Track panel sizes
  const [horizontalSizes, setHorizontalSizes] = useState([30, 70]);
  const [leftVerticalSizes, setLeftVerticalSizes] = useState([30, 70]);
  const [rightVerticalSizes, setRightVerticalSizes] = useState([30, 70]);
  const [isDragging, setIsDragging] = useState(false);

  // References to panel groups for programmatic resizing
  const leftPanelGroupRef = useRef<ImperativePanelGroupHandle>(null);
  const rightPanelGroupRef = useRef<ImperativePanelGroupHandle>(null);
  const horizontalPanelGroupRef = useRef<ImperativePanelGroupHandle>(null);

  // Handle cross-section drag
  const handleCrossDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const startHorizontal = horizontalSizes[0];
    const startLeftVertical = leftVerticalSizes[0];

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = ((moveEvent.clientX - startX) / window.innerWidth) * 100;
      const deltaY = ((moveEvent.clientY - startY) / window.innerHeight) * 100;

      // Update horizontal sizes
      const newHorizontalSize = Math.max(
        20,
        Math.min(80, startHorizontal + deltaX)
      );
      horizontalPanelGroupRef.current?.setLayout([
        newHorizontalSize,
        100 - newHorizontalSize,
      ]);

      // Update vertical sizes for both columns
      const newVerticalSize = Math.max(
        20,
        Math.min(80, startLeftVertical + deltaY)
      );
      leftPanelGroupRef.current?.setLayout([
        newVerticalSize,
        100 - newVerticalSize,
      ]);
      rightPanelGroupRef.current?.setLayout([
        newVerticalSize,
        100 - newVerticalSize,
      ]);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div className={`relative ${className}`}>
      <PanelGroup
        ref={horizontalPanelGroupRef}
        direction="horizontal"
        onLayout={setHorizontalSizes}
      >
        {/* Left Column */}
        <Panel defaultSize={30} minSize={20}>
          <PanelGroup
            direction="vertical"
            ref={leftPanelGroupRef}
            onLayout={setLeftVerticalSizes}
          >
            <Panel defaultSize={30} minSize={20}>
              {topLeft}
            </Panel>
            <PanelResizeHandle className="h-1 bg-gray-200 hover:bg-gray-300 transition-colors" />
            <Panel defaultSize={70} minSize={20}>
              {bottomLeft}
            </Panel>
          </PanelGroup>
        </Panel>

        <PanelResizeHandle className="w-1 bg-gray-200 hover:bg-gray-300 transition-colors" />

        {/* Right Column */}
        <Panel defaultSize={70} minSize={20}>
          <PanelGroup
            direction="vertical"
            ref={rightPanelGroupRef}
            onLayout={setRightVerticalSizes}
          >
            <Panel defaultSize={30} minSize={20}>
              {topRight}
            </Panel>
            <PanelResizeHandle className="h-1 bg-gray-200 hover:bg-gray-300 transition-colors" />
            <Panel defaultSize={70} minSize={20}>
              {bottomRight}
            </Panel>
          </PanelGroup>
        </Panel>
      </PanelGroup>

      {/* Cross-section handle */}
      <div
        className={`absolute w-6 h-6 bg-gray-100 hover:bg-gray-200 rounded-full cursor-move transform -translate-x-1/2 -translate-y-1/2 transition-colors z-50 flex items-center justify-center shadow-md ${
          isDragging ? "bg-gray-200 scale-110" : ""
        }`}
        style={{
          left: `${horizontalSizes[0]}%`,
          top: `${leftVerticalSizes[0]}%`,
        }}
        onMouseDown={handleCrossDragStart}
      >
        <FontAwesomeIcon
          icon={faUpDownLeftRight}
          className={`text-sm transition-transform ${
            isDragging ? "scale-110" : ""
          }`}
        />
      </div>
    </div>
  );
}
