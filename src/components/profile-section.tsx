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
  const [selectedFile, setSelectedFile] = useState("data.json");
  const { isLoading, setIsLoading, clearSelections } = useCenterControl();

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
      } catch (error) {
        console.error("Failed to fetch available data files:", error);
      }
    };
    fetchAvailableFiles();
  }, []);

  // Handle file selection
  const handleFileChange = useCallback(
    async (fileName: string) => {
      setIsLoading(true);
      setSelectedFile(fileName);
      // Clear all selections when changing files
      clearSelections();

      try {
        const response = await fetch(`/${fileName}`);
        const data: TimelineData = await response.json();
        onDataChange?.(data);
      } catch (error) {
        console.error("Failed to load data file:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [onDataChange, setIsLoading, clearSelections]
  );

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
              <span className="text-sm text-neutral-500">Loading...</span>
            )}
            <Select value={selectedFile} onValueChange={handleFileChange}>
              <SelectTrigger className="w-[150px] h-7 px-2 py-1 text-xs">
                <SelectValue placeholder="Select data file" />
              </SelectTrigger>
              <SelectContent>
                {availableFiles.map((file) => (
                  <SelectItem key={file} value={file} className="text-xs py-1">
                    {file}
                  </SelectItem>
                ))}
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
