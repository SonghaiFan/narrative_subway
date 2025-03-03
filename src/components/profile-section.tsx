"use client";

import { NarrativeEvent, TimelineData } from "@/types/article";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useCenterControl } from "@/lib/center-control-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProfileSectionProps {
  title: string;
  topic: string;
  description: string;
  author: string;
  publishDate: string;
  imageUrl?: string | null;
  events: NarrativeEvent[];
  onDataChange?: (data: TimelineData) => void;
}

export function ProfileSection({
  title,
  topic,
  description,
  author,
  publishDate,
  imageUrl,
  events,
  onDataChange,
}: ProfileSectionProps) {
  const [availableFiles, setAvailableFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>("");
  const { isLoading, setIsLoading, clearSelections, data } = useCenterControl();

  const stats = {
    entities: new Set(
      events.flatMap((event) => event.entities.map((e) => e.id))
    ).size,
    topics: new Set(events.map((event) => event.topic.main_topic)).size,
    events: events.length,
  };

  // Fetch available data files from public directory
  useEffect(() => {
    const fetchAvailableFiles = async () => {
      try {
        const response = await fetch("/api/data-files");
        const files = await response.json();
        setAvailableFiles(files);

        // If we don't have a selected file yet and files are available, select the first one
        if (!selectedFile && files.length > 0) {
          // Try to find the first non-archived file
          const nonArchivedFile = files.find(
            (file) => !file.startsWith("archived/")
          );
          setSelectedFile(nonArchivedFile || files[0]);
        }
      } catch (error) {
        console.error("Failed to fetch available data files:", error);
      }
    };
    fetchAvailableFiles();
  }, [selectedFile]);

  // Handle file selection
  const handleFileChange = useCallback(
    async (fileName: string) => {
      if (fileName === selectedFile) return;

      setIsLoading(true);
      setSelectedFile(fileName);
      // Clear all selections when changing files
      clearSelections();

      try {
        // Handle paths correctly - if the file is in the archived directory
        const filePath = fileName.startsWith("archived/")
          ? fileName // Keep the path as is
          : fileName; // No path prefix needed

        const response = await fetch(`/${filePath}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${fileName}`);
        }
        const data: TimelineData = await response.json();
        onDataChange?.(data);
      } catch (error) {
        console.error("Failed to load data file:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [onDataChange, setIsLoading, clearSelections, selectedFile]
  );

  // Update selectedFile when data changes from outside this component
  useEffect(() => {
    // This is a simple heuristic to detect which file is currently loaded
    // We compare the title and first event to guess which file it is
    if (data && availableFiles.length > 0 && !isLoading) {
      const checkCurrentFile = async () => {
        // Skip if we're already loading
        if (isLoading) return;

        // First check if the current selectedFile matches the data
        // This avoids unnecessary API calls
        if (selectedFile) {
          try {
            const response = await fetch(
              `/${
                selectedFile.startsWith("archived/")
                  ? selectedFile
                  : selectedFile
              }`
            );
            const fileData = await response.json();

            // If this file matches the current data, we're done
            if (
              fileData.metadata.title === data.metadata.title &&
              fileData.events.length > 0 &&
              data.events.length > 0 &&
              fileData.events[0].index === data.events[0].index
            ) {
              return; // Current selection is correct
            }
          } catch (error) {
            console.error(
              `Error checking current file ${selectedFile}:`,
              error
            );
          }
        }

        // If we get here, we need to check all files
        for (const file of availableFiles) {
          // Skip the current file as we already checked it
          if (file === selectedFile) continue;

          try {
            const filePath = file.startsWith("archived/") ? file : file;
            const response = await fetch(`/${filePath}`);
            const fileData = await response.json();

            // Check if this file matches the current data
            if (
              fileData.metadata.title === data.metadata.title &&
              fileData.events.length > 0 &&
              data.events.length > 0 &&
              fileData.events[0].index === data.events[0].index
            ) {
              setSelectedFile(file);
              break;
            }
          } catch (error) {
            console.error(`Error checking file ${file}:`, error);
          }
        }
      };

      checkCurrentFile();
    }
  }, [data, availableFiles, selectedFile, isLoading]);

  return (
    <article className="flex flex-col h-full p-4 space-y-4 overflow-hidden">
      <header className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="px-2 py-0.5 bg-neutral-100 text-neutral-800 rounded-full">
              {topic}
            </span>
            <time className="text-neutral-600" dateTime={publishDate}>
              {new Date(publishDate).toLocaleDateString("en-US", {
                month: "short",
                day: "2-digit",
              })}
            </time>
          </div>
          <div className="flex items-center gap-2">
            {isLoading && (
              <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                <div className="w-3 h-3 border-2 border-neutral-300 border-t-neutral-500 rounded-full animate-spin"></div>
                <span>Loading...</span>
              </div>
            )}
            <Select value={selectedFile} onValueChange={handleFileChange}>
              <SelectTrigger className="w-[180px] h-7 px-2 py-1 text-xs">
                <SelectValue
                  placeholder="Select data file"
                  className="truncate"
                />
              </SelectTrigger>
              <SelectContent>
                {(() => {
                  // Separate archived and non-archived files
                  const nonArchivedFiles = availableFiles.filter(
                    (file) => !file.startsWith("archived/")
                  );
                  const archivedFiles = availableFiles.filter((file) =>
                    file.startsWith("archived/")
                  );

                  return (
                    <>
                      {/* Non-archived files */}
                      {nonArchivedFiles.map((file) => {
                        const displayName = file;
                        const truncatedName =
                          displayName.length > 25
                            ? displayName.substring(0, 22) + "..."
                            : displayName;

                        return (
                          <SelectItem
                            key={file}
                            value={file}
                            className="text-xs py-1"
                            title={file}
                          >
                            <span className="truncate block max-w-[160px]">
                              {truncatedName}
                            </span>
                          </SelectItem>
                        );
                      })}

                      {/* Add separator if both archived and non-archived files exist */}
                      {nonArchivedFiles.length > 0 &&
                        archivedFiles.length > 0 && (
                          <div className="px-2 py-1.5 text-xs text-neutral-400 border-t border-neutral-200 mt-1 pt-1">
                            Archived Files
                          </div>
                        )}

                      {/* Archived files */}
                      {archivedFiles.map((file) => {
                        const displayName = file.split("/").pop() || file;
                        const truncatedName =
                          displayName.length > 25
                            ? displayName.substring(0, 22) + "..."
                            : displayName;

                        return (
                          <SelectItem
                            key={file}
                            value={file}
                            className="text-xs py-1"
                            title={file}
                          >
                            <span className="truncate block max-w-[160px]">
                              <span className="text-neutral-500 mr-1">
                                [Archived]{" "}
                              </span>
                              {truncatedName}
                            </span>
                          </SelectItem>
                        );
                      })}
                    </>
                  );
                })()}
              </SelectContent>
            </Select>
          </div>
        </div>

        <h1 className="text-xl font-bold text-neutral-900 leading-tight">
          {title}
        </h1>
        <p className="text-sm text-neutral-600">By {author}</p>
      </header>

      <div className="relative aspect-video w-full bg-neutral-100 rounded-lg overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              className="w-12 h-12 text-neutral-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>

      <p className="text-sm text-neutral-600 leading-relaxed">{description}</p>

      <footer className="mt-auto pt-3 border-t border-neutral-100">
        <div className="grid grid-cols-3 gap-2 text-center">
          {Object.entries(stats).map(([key, value]) => (
            <div key={key}>
              <div className="text-xs font-medium text-neutral-500 capitalize">
                {key}
              </div>
              <div className="text-lg font-semibold text-neutral-900">
                {value}
              </div>
            </div>
          ))}
        </div>
      </footer>
    </article>
  );
}
