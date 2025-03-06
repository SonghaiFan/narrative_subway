"use client";

import { useState, useRef, useEffect } from "react";
import {
  Panel,
  PanelGroup,
  ImperativePanelGroupHandle,
} from "react-resizable-panels";

interface ResizableGridProps {
  topLeft: React.ReactNode;
  topRight: React.ReactNode;
  bottomLeft: React.ReactNode;
  bottomRight: React.ReactNode;
  className?: string;
}

// Simple modal component for display warnings
function DisplayWarningModal({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-start mb-4">
          <div className="flex-shrink-0 text-yellow-500">
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-lg font-medium text-gray-900">
              Display Compatibility Warning
            </h3>
            <div className="mt-2 text-sm text-gray-500">
              <p>{message}</p>
            </div>
          </div>
        </div>
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            className="inline-flex justify-center rounded-md border border-transparent bg-yellow-100 px-4 py-2 text-sm font-medium text-yellow-900 hover:bg-yellow-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 focus-visible:ring-offset-2"
            onClick={onClose}
          >
            I understand
          </button>
        </div>
      </div>
    </div>
  );
}

export function ResizableGrid({
  topLeft,
  topRight,
  bottomLeft,
  bottomRight,
  className = "",
}: ResizableGridProps) {
  // Panel configuration with proportions matching the screenshot
  // These values must add up to exactly 100
  const DEFAULT_LEFT_WIDTH = 45;
  const DEFAULT_RIGHT_WIDTH = 55;
  const DEFAULT_TOP_HEIGHT = 45;
  const DEFAULT_BOTTOM_HEIGHT = 55;

  // Min/max constraints
  const MIN_SIZE = 30;
  const MAX_SIZE = 70;

  // Track panel sizes
  const [horizontalSizes, setHorizontalSizes] = useState([
    DEFAULT_LEFT_WIDTH,
    DEFAULT_RIGHT_WIDTH,
  ]);
  const [leftVerticalSizes, setLeftVerticalSizes] = useState([
    DEFAULT_TOP_HEIGHT,
    DEFAULT_BOTTOM_HEIGHT,
  ]);
  const [rightVerticalSizes, setRightVerticalSizes] = useState([
    DEFAULT_TOP_HEIGHT,
    DEFAULT_BOTTOM_HEIGHT,
  ]);
  const [isDragging, setIsDragging] = useState(false);
  const [displayWarning, setDisplayWarning] = useState<string | null>(null);
  const [showWarningModal, setShowWarningModal] = useState(false);

  // References to panel groups for programmatic resizing
  const leftPanelGroupRef = useRef<ImperativePanelGroupHandle>(null);
  const rightPanelGroupRef = useRef<ImperativePanelGroupHandle>(null);
  const horizontalPanelGroupRef = useRef<ImperativePanelGroupHandle>(null);

  // Log panel size changes
  useEffect(() => {
    console.log("Horizontal ratio changed:", horizontalSizes);
  }, [horizontalSizes]);

  useEffect(() => {
    console.log("Left vertical ratio changed:", leftVerticalSizes);
  }, [leftVerticalSizes]);

  useEffect(() => {
    console.log("Right vertical ratio changed:", rightVerticalSizes);
  }, [rightVerticalSizes]);

  // Check display compatibility and show modal if needed
  useEffect(() => {
    const checkDisplay = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      let warningMessage = null;

      if (width < 768) {
        warningMessage =
          "Screen width is too small. For optimal experience, use a larger display like DELL P2419H or similar.";
      } else if (width > 2560) {
        warningMessage =
          "Screen width is very large. UI elements might appear stretched. Optimal displays include DELL P2419H, P2418HT, or standard laptop screens.";
      } else if (height < 600) {
        warningMessage =
          "Screen height is too small. For optimal experience, use a taller display like DELL P2419H or similar.";
      }

      if (warningMessage !== displayWarning) {
        setDisplayWarning(warningMessage);
        if (warningMessage) {
          setShowWarningModal(true);
        }
      }
    };

    checkDisplay();
    window.addEventListener("resize", checkDisplay);

    return () => {
      window.removeEventListener("resize", checkDisplay);
    };
  }, [displayWarning]);

  // Handle panel layout changes with detailed logging
  const handleHorizontalLayoutChange = (sizes: number[]) => {
    console.log(
      `Horizontal layout changed to: ${sizes[0].toFixed(
        2
      )}% / ${sizes[1].toFixed(2)}%`
    );
    setHorizontalSizes(sizes);
  };

  const handleLeftVerticalLayoutChange = (sizes: number[]) => {
    console.log(
      `Left vertical layout changed to: ${sizes[0].toFixed(
        2
      )}% / ${sizes[1].toFixed(2)}%`
    );
    setLeftVerticalSizes(sizes);
  };

  const handleRightVerticalLayoutChange = (sizes: number[]) => {
    console.log(
      `Right vertical layout changed to: ${sizes[0].toFixed(
        2
      )}% / ${sizes[1].toFixed(2)}%`
    );
    setRightVerticalSizes(sizes);
  };

  // Synchronize scroll positions
  useEffect(() => {
    const divs = document.querySelectorAll(".overflow-auto");

    const handleScroll = (e: Event) => {
      const scrolledDiv = e.target as HTMLDivElement;
      divs.forEach((div) => {
        if (div !== scrolledDiv) {
          const d = div as HTMLDivElement;
          d.scrollTop = scrolledDiv.scrollTop;
          d.scrollLeft = scrolledDiv.scrollLeft;
        }
      });
    };

    divs.forEach((div) => {
      div.addEventListener("scroll", handleScroll);
    });

    return () => {
      divs.forEach((div) => {
        div.removeEventListener("scroll", handleScroll);
      });
    };
  }, []);

  // Handle cross-section drag - simplified
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

      // Update horizontal sizes (width) with 30/70 constraints
      const newHorizontalSize = Math.max(
        MIN_SIZE,
        Math.min(MAX_SIZE, startHorizontal + deltaX)
      );
      horizontalPanelGroupRef.current?.setLayout([
        newHorizontalSize,
        100 - newHorizontalSize,
      ]);
      console.log(
        `Cross-drag horizontal: ${newHorizontalSize.toFixed(2)}% / ${(
          100 - newHorizontalSize
        ).toFixed(2)}%`
      );

      // Update vertical sizes (height) for both columns with 30/70 constraints
      const newVerticalSize = Math.max(
        MIN_SIZE,
        Math.min(MAX_SIZE, startLeftVertical + deltaY)
      );
      leftPanelGroupRef.current?.setLayout([
        newVerticalSize,
        100 - newVerticalSize,
      ]);
      rightPanelGroupRef.current?.setLayout([
        newVerticalSize,
        100 - newVerticalSize,
      ]);
      console.log(
        `Cross-drag vertical: ${newVerticalSize.toFixed(2)}% / ${(
          100 - newVerticalSize
        ).toFixed(2)}%`
      );
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // Close warning modal
  const handleCloseWarningModal = () => {
    setShowWarningModal(false);
  };

  return (
    <div className={`h-full w-full ${className} relative`}>
      {showWarningModal && displayWarning && (
        <DisplayWarningModal
          message={displayWarning}
          onClose={handleCloseWarningModal}
        />
      )}

      {/* Main grid layout */}
      <PanelGroup
        ref={horizontalPanelGroupRef}
        direction="horizontal"
        onLayout={handleHorizontalLayoutChange}
        className="h-full w-full"
      >
        {/* Left column */}
        <Panel
          id="left-column"
          defaultSize={DEFAULT_LEFT_WIDTH}
          minSize={MIN_SIZE}
          maxSize={MAX_SIZE}
          className="h-full"
        >
          <PanelGroup
            ref={leftPanelGroupRef}
            direction="vertical"
            onLayout={handleLeftVerticalLayoutChange}
            className="h-full"
          >
            {/* Top left panel */}
            <Panel
              id="top-left"
              defaultSize={DEFAULT_TOP_HEIGHT}
              minSize={MIN_SIZE}
              maxSize={MAX_SIZE}
              className="h-full"
            >
              {topLeft}
            </Panel>
            {/* Bottom left panel */}
            <Panel
              id="bottom-left"
              defaultSize={DEFAULT_BOTTOM_HEIGHT}
              minSize={MIN_SIZE}
              maxSize={MAX_SIZE}
              className="h-full"
            >
              {bottomLeft}
            </Panel>
          </PanelGroup>
        </Panel>

        {/* Right column */}
        <Panel
          id="right-column"
          defaultSize={DEFAULT_RIGHT_WIDTH}
          minSize={MIN_SIZE}
          maxSize={MAX_SIZE}
          className="h-full"
        >
          <PanelGroup
            ref={rightPanelGroupRef}
            direction="vertical"
            onLayout={handleRightVerticalLayoutChange}
            className="h-full"
          >
            {/* Top right panel */}
            <Panel
              id="top-right"
              defaultSize={DEFAULT_TOP_HEIGHT}
              minSize={MIN_SIZE}
              maxSize={MAX_SIZE}
              className="h-full"
            >
              {topRight}
            </Panel>
            {/* Bottom right panel */}
            <Panel
              id="bottom-right"
              defaultSize={DEFAULT_BOTTOM_HEIGHT}
              minSize={MIN_SIZE}
              maxSize={MAX_SIZE}
              className="h-full"
            >
              {bottomRight}
            </Panel>
          </PanelGroup>
        </Panel>
      </PanelGroup>

      {/* Cross-section handle*/}
      <div
        className={`absolute w-6 h-6 bg-gray-100 hover:bg-gray-200 rounded-full cursor-move transform -translate-x-1/2 -translate-y-1/2 transition-colors z-50 flex items-center justify-center shadow-md border border-gray-300 ${
          isDragging ? "bg-gray-200 scale-110" : ""
        }`}
        style={{
          left: `${horizontalSizes[0]}%`,
          top: `${leftVerticalSizes[0]}%`,
        }}
        onMouseDown={handleCrossDragStart}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4 4h4v4H4V4zm12 0h4v4h-4V4zM4 16h4v4H4v-4zm12 0h4v4h-4v-4z"
            fill="currentColor"
          />
        </svg>
      </div>
    </div>
  );
}
