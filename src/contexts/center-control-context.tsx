"use client";

import { NarrativeEvent, TimelineData } from "@/types/narrative/article";
import {
  createContext,
  useCallback,
  useContext,
  useState,
  ReactNode,
} from "react";

interface CenterControlContextType {
  // Data state
  data: TimelineData | null;
  setData: (data: TimelineData) => void;

  // Selected event state
  selectedEventId: number | null;
  setSelectedEventId: (id: number | null) => void;

  // Selected entity state
  selectedEntityId: string | null;
  setSelectedEntityId: (id: string | null) => void;

  // Selected topic state
  selectedTopic: string | null;
  setSelectedTopic: (topic: string | null) => void;

  // Loading and error states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;

  // Utility functions
  getSelectedEvent: () => NarrativeEvent | undefined;
  clearSelections: () => void;
}

const CenterControlContext = createContext<
  CenterControlContextType | undefined
>(undefined);

export function CenterControlProvider({
  children,
  initialData = null,
}: {
  children: ReactNode;
  initialData?: TimelineData | null;
}) {
  // Data state
  const [data, setDataState] = useState<TimelineData | null>(initialData);

  // Selection states
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  // Loading and error states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Set data with validation
  const setData = useCallback((newData: TimelineData) => {
    setDataState(newData);
  }, []);

  // Get the currently selected event
  const getSelectedEvent = useCallback(() => {
    if (!data || selectedEventId === null) return undefined;
    return data.events.find((event) => event.index === selectedEventId);
  }, [data, selectedEventId]);

  // Clear all selections
  const clearSelections = useCallback(() => {
    setSelectedEventId(null);
    setSelectedEntityId(null);
    setSelectedTopic(null);
  }, []);

  const value = {
    // Data state
    data,
    setData,

    // Selection states
    selectedEventId,
    setSelectedEventId,
    selectedEntityId,
    setSelectedEntityId,
    selectedTopic,
    setSelectedTopic,

    // Loading and error states
    isLoading,
    setIsLoading,
    error,
    setError,

    // Utility functions
    getSelectedEvent,
    clearSelections,
  };

  return (
    <CenterControlContext.Provider value={value}>
      {children}
    </CenterControlContext.Provider>
  );
}

export function useCenterControl() {
  const context = useContext(CenterControlContext);

  if (context === undefined) {
    throw new Error(
      "useCenterControl must be used within a CenterControlProvider"
    );
  }

  return context;
}
