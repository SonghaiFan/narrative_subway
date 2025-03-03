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
  // Simple panel configuration - optimized for common displays
  const DEFAULT_LEFT_WIDTH = 30;
  const DEFAULT_RIGHT_WIDTH = 70;
  const DEFAULT_TOP_HEIGHT = 30;
  const DEFAULT_BOTTOM_HEIGHT = 70;

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

      // Update horizontal sizes (width) with simplified constraints
      const newHorizontalSize = Math.max(
        20,
        Math.min(50, startHorizontal + deltaX)
      );
      horizontalPanelGroupRef.current?.setLayout([
        newHorizontalSize,
        100 - newHorizontalSize,
      ]);

      // Update vertical sizes (height) for both columns with simplified constraints
      const newVerticalSize = Math.max(
        20,
        Math.min(40, startLeftVertical + deltaY)
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

  // Close warning modal
  const handleCloseWarningModal = () => {
    setShowWarningModal(false);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Display warning modal */}
      {showWarningModal && displayWarning && (
        <DisplayWarningModal
          message={displayWarning}
          onClose={handleCloseWarningModal}
        />
      )}

      <PanelGroup
        ref={horizontalPanelGroupRef}
        direction="horizontal"
        onLayout={setHorizontalSizes}
      >
        {/* Left Column  */}
        <Panel defaultSize={DEFAULT_LEFT_WIDTH} minSize={20}>
          <PanelGroup
            direction="vertical"
            ref={leftPanelGroupRef}
            onLayout={setLeftVerticalSizes}
          >
            <Panel defaultSize={DEFAULT_TOP_HEIGHT} minSize={20}>
              {topLeft}
            </Panel>
            <Panel defaultSize={DEFAULT_BOTTOM_HEIGHT} minSize={20}>
              {bottomLeft}
            </Panel>
          </PanelGroup>
        </Panel>

        {/* Right Column  */}
        <Panel defaultSize={DEFAULT_RIGHT_WIDTH} minSize={50}>
          <PanelGroup
            direction="vertical"
            ref={rightPanelGroupRef}
            onLayout={setRightVerticalSizes}
          >
            <Panel defaultSize={DEFAULT_TOP_HEIGHT} minSize={20}>
              {topRight}
            </Panel>
            <Panel defaultSize={DEFAULT_BOTTOM_HEIGHT} minSize={20}>
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
