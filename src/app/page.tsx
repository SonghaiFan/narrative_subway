"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CenterControlProvider } from "@/lib/center-control-context";
import { TooltipProvider } from "@/lib/tooltip-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Visualization modules
const modules = [
  {
    id: "entity",
    name: "Entity Dimension",
    description:
      "Explore focus roles, relationships, and representations within narratives",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      </svg>
    ),
    color: "bg-blue-50 text-blue-600",
  },
  {
    id: "time",
    name: "Time Dimension",
    description:
      "Analyze event sequences and temporal structures in narratives",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
      </svg>
    ),
    color: "bg-green-50 text-green-600",
  },
  {
    id: "topic",
    name: "Theme Dimension",
    description:
      "Discover topics, emotions, and theme evolution across narratives",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
        <line x1="12" y1="22.08" x2="12" y2="12"></line>
      </svg>
    ),
    color: "bg-purple-50 text-purple-600",
  },
];

function LandingPage() {
  const [selectedDataset, setSelectedDataset] = useState("");
  const [availableFiles, setAvailableFiles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [datasetInfo, setDatasetInfo] = useState<
    Record<string, { title: string; description: string }>
  >({});

  // Fetch available data files from data directory
  useEffect(() => {
    const fetchAvailableFiles = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/data-files");
        const files = await response.json();
        setAvailableFiles(files);

        // Set default selected file if available
        if (
          files.length > 0 &&
          (!selectedDataset || !files.includes(selectedDataset))
        ) {
          setSelectedDataset(files[0]);
        }
      } catch (error) {
        console.error("Failed to fetch available data files:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailableFiles();
  }, [selectedDataset]);

  // Fetch dataset metadata for all available files
  useEffect(() => {
    const fetchDatasetInfo = async () => {
      const info: Record<string, { title: string; description: string }> = {};

      for (const file of availableFiles) {
        try {
          const response = await fetch(`/data/${file}`);
          if (response.ok) {
            const data = await response.json();
            if (data.metadata) {
              info[file] = {
                title: data.metadata.title || "Untitled Dataset",
                description:
                  data.metadata.description || "No description available",
              };
            }
          }
        } catch (error) {
          console.error(`Failed to fetch metadata for ${file}:`, error);
        }
      }

      setDatasetInfo(info);
    };

    if (availableFiles.length > 0) {
      fetchDatasetInfo();
    }
  }, [availableFiles]);

  // Get friendly name for dataset
  const getDatasetName = (filename: string, truncate = false) => {
    if (datasetInfo[filename]) {
      const title = datasetInfo[filename].title;
      if (truncate && title.length > 25) {
        return title.substring(0, 25) + "...";
      }
      return title;
    }

    // Remove extension and format
    const name = filename.replace(".json", "").replace(/_/g, " ");
    if (truncate && name.length > 25) {
      return name.substring(0, 25) + "...";
    }
    return name;
  };

  // Get description for dataset
  const getDatasetDescription = (filename: string) => {
    if (datasetInfo[filename]) {
      return datasetInfo[filename].description;
    }

    // Fallback descriptions
    if (filename === "data.json")
      return "Analysis of events, entities, and narratives in the Gaza-Israel conflict";
    if (filename === "data_Israel.json")
      return "Events and narratives from the Israeli perspective";

    return "Dataset information";
  };

  return (
    <div className="flex flex-col min-h-screen h-screen bg-white">
      {/* Header - Minimalist */}
      <header className="border-b border-gray-100 py-4">
        <div className="max-w-5xl mx-auto px-4 flex justify-between items-center">
          <h1 className="text-xl font-medium text-gray-900">
            Narrative Subway
          </h1>
          <p className="text-sm text-gray-500">
            Visualizing Narrative Structures
          </p>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow overflow-auto">
        <div className="max-w-5xl mx-auto px-4 py-8 h-full">
          <div className="flex flex-col h-full">
            {/* Introduction - More compact */}
            <section className="mb-8 text-center">
              <h2 className="text-xl font-medium text-gray-900 mb-2">
                Explore Narrative Dimensions
              </h2>
              <p className="max-w-2xl mx-auto text-sm text-gray-600">
                Analyze and visualize narratives through three key dimensions:
                entity, time, and theme. Select a dataset and visualization
                module to begin your exploration.
              </p>
            </section>

            {/* Dataset Selection - Cleaner design */}
            <section className="mb-8">
              <div className="mb-2">
                <h3 className="text-base font-medium text-gray-900">
                  Select Dataset
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Choose a dataset to explore with the visualization modules
                </p>
              </div>

              <div className="flex items-center gap-3 mb-3">
                {isLoading && (
                  <span className="text-xs text-gray-500">Loading...</span>
                )}
                <Select
                  value={selectedDataset}
                  onValueChange={setSelectedDataset}
                >
                  <SelectTrigger className="w-[240px] h-9 text-sm">
                    <SelectValue
                      placeholder="Select dataset"
                      className="truncate"
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {availableFiles.map((file) => (
                      <SelectItem
                        key={file}
                        value={file}
                        className="truncate text-sm"
                      >
                        {getDatasetName(file, true)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedDataset && (
                <div className="p-3 bg-gray-50 rounded-md border border-gray-100 text-sm">
                  <h4 className="font-medium text-gray-900 mb-1 truncate">
                    {getDatasetName(selectedDataset, false)}
                  </h4>
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {getDatasetDescription(selectedDataset)}
                  </p>
                </div>
              )}
            </section>

            {/* Visualization Modules - Minimalist cards */}
            <section className="flex-grow">
              <h3 className="text-base font-medium text-gray-900 mb-4">
                Visualization Modules
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {modules.map((module) => (
                  <Link
                    key={module.id}
                    href={`/visualization?dataset=${selectedDataset}&module=${module.id}`}
                    className={`block group ${
                      !selectedDataset ? "pointer-events-none opacity-50" : ""
                    }`}
                  >
                    <div
                      className={`${module.color} rounded-md p-4 h-full transition-all hover:shadow-sm flex flex-col border border-gray-100`}
                    >
                      <div className="mb-3">{module.icon}</div>
                      <h4 className="text-sm font-medium mb-1">
                        {module.name}
                      </h4>
                      <p className="text-xs text-gray-600 mb-3 flex-grow line-clamp-3">
                        {module.description}
                      </p>
                      <div className="flex justify-end mt-auto">
                        <span className="inline-flex items-center text-xs font-medium group-hover:underline">
                          Explore
                          <svg
                            className="ml-1 h-3 w-3"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Footer - Minimalist */}
      <footer className="border-t border-gray-100 py-3">
        <div className="max-w-5xl mx-auto px-4">
          <p className="text-center text-xs text-gray-400">
            © 2025 Narrative Subway. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <CenterControlProvider>
      <TooltipProvider>
        <LandingPage />
      </TooltipProvider>
    </CenterControlProvider>
  );
}
