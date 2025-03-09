"use client";

import { useState, useEffect } from "react";
import { resetTaskProgress, resetAllTaskProgress } from "@/lib/task-progress";

interface StorageItem {
  key: string;
  value: any;
  type: string;
  source: "localStorage" | "cookie";
}

// List of keys that are relevant to our project
const PROJECT_RELATED_KEYS = [
  "user",
  "taskProgress_",
  "studyCompleted",
  "hasCompletedIntro",
];

// List of cookies that are relevant to our project
const PROJECT_RELATED_COOKIES = ["hasCompletedIntro"];

export function UserDataViewer() {
  const [storageItems, setStorageItems] = useState<StorageItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<StorageItem | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "all" | "localStorage" | "cookies"
  >("all");

  // Only run on client-side
  useEffect(() => {
    setIsClient(true);
    refreshStorageItems();
  }, []);

  const parseCookies = (): Record<string, string> => {
    const cookies: Record<string, string> = {};
    if (typeof document === "undefined") return cookies;

    document.cookie.split(";").forEach((cookie) => {
      const [name, value] = cookie.trim().split("=");
      if (name) cookies[name] = value || "";
    });

    return cookies;
  };

  const refreshStorageItems = () => {
    if (typeof window === "undefined") return;

    const items: StorageItem[] = [];

    // Get localStorage items
    const keys = Object.keys(localStorage);

    // Filter only project-related keys
    const relevantKeys = keys.filter((key) =>
      PROJECT_RELATED_KEYS.some(
        (projectKey) => key === projectKey || key.startsWith(projectKey)
      )
    );

    // Filter task progress keys first, then other relevant keys
    const progressKeys = relevantKeys.filter((key) =>
      key.startsWith("taskProgress_")
    );
    const otherRelevantKeys = relevantKeys.filter(
      (key) => !key.startsWith("taskProgress_")
    );

    // Add task progress items first
    progressKeys.forEach((key) => {
      try {
        const value = JSON.parse(localStorage.getItem(key) || "{}");
        items.push({
          key,
          value,
          type: "Task Progress",
          source: "localStorage",
        });
      } catch (error) {
        items.push({
          key,
          value: localStorage.getItem(key),
          type: "Unknown (Parse Error)",
          source: "localStorage",
        });
      }
    });

    // Add other relevant items
    otherRelevantKeys.forEach((key) => {
      try {
        const value = JSON.parse(localStorage.getItem(key) || "{}");
        items.push({
          key,
          value,
          type: key === "user" ? "User Data" : "Study Data",
          source: "localStorage",
        });
      } catch (error) {
        items.push({
          key,
          value: localStorage.getItem(key),
          type: "String",
          source: "localStorage",
        });
      }
    });

    // Get cookie items
    const cookies = parseCookies();
    Object.entries(cookies).forEach(([name, value]) => {
      // Only include project-related cookies or if the name is empty (which shouldn't happen)
      if (PROJECT_RELATED_COOKIES.includes(name) || name === "") {
        try {
          // Try to parse as JSON first
          const parsedValue = JSON.parse(value);
          items.push({
            key: name,
            value: parsedValue,
            type: "Cookie Data",
            source: "cookie",
          });
        } catch (error) {
          // If not JSON, store as string
          items.push({
            key: name,
            value,
            type: "Cookie Data",
            source: "cookie",
          });
        }
      }
    });

    setStorageItems(items);
  };

  const handleResetItem = (key: string, source: "localStorage" | "cookie") => {
    if (typeof window === "undefined") return;

    if (source === "localStorage") {
      if (key.startsWith("taskProgress_")) {
        const userId = key.replace("taskProgress_", "");
        resetTaskProgress(userId);
      } else {
        localStorage.removeItem(key);
      }
    } else if (source === "cookie") {
      // Delete the cookie by setting its expiration date to the past
      document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }

    refreshStorageItems();
    setSelectedItem(null);
  };

  const handleResetAllProgress = () => {
    if (
      window.confirm(
        "Are you sure you want to reset all user progress? This cannot be undone."
      )
    ) {
      // Reset all localStorage progress
      resetAllTaskProgress();

      // Reset all cookies
      PROJECT_RELATED_COOKIES.forEach((cookieName) => {
        document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      });

      refreshStorageItems();
      setSelectedItem(null);
    }
  };

  const handleViewItem = (item: StorageItem) => {
    setSelectedItem(item);
  };

  const filteredItems = storageItems.filter((item) => {
    if (activeTab === "all") return true;
    if (activeTab === "localStorage") return item.source === "localStorage";
    if (activeTab === "cookies") return item.source === "cookie";
    return true;
  });

  if (!isClient) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900">User Data Storage</h2>
        <div className="flex space-x-2">
          <button
            onClick={refreshStorageItems}
            className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200"
          >
            Refresh
          </button>
          <button
            onClick={handleResetAllProgress}
            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
          >
            Reset All Progress
          </button>
        </div>
      </div>

      <div className="mb-4 border-b border-gray-200">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab("all")}
            className={`py-2 px-4 text-sm font-medium ${
              activeTab === "all"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            All Data
          </button>
          <button
            onClick={() => setActiveTab("localStorage")}
            className={`py-2 px-4 text-sm font-medium ${
              activeTab === "localStorage"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Local Storage
          </button>
          <button
            onClick={() => setActiveTab("cookies")}
            className={`py-2 px-4 text-sm font-medium ${
              activeTab === "cookies"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Cookies
          </button>
        </nav>
      </div>

      {filteredItems.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No{" "}
          {activeTab === "all"
            ? "project-related data"
            : activeTab === "localStorage"
            ? "local storage data"
            : "cookie data"}{" "}
          found
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1 border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b">
              <h3 className="font-medium text-sm text-gray-700">
                Storage Items
              </h3>
            </div>
            <div className="overflow-y-auto max-h-96">
              <ul className="divide-y">
                {filteredItems.map((item) => (
                  <li
                    key={`${item.source}-${item.key}`}
                    className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-50 ${
                      selectedItem?.key === item.key &&
                      selectedItem?.source === item.source
                        ? "bg-blue-50"
                        : ""
                    }`}
                    onClick={() => handleViewItem(item)}
                  >
                    <div className="font-medium truncate">{item.key}</div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">{item.type}</span>
                      <span
                        className={`text-xs ${
                          item.source === "localStorage"
                            ? "text-blue-500"
                            : "text-green-500"
                        }`}
                      >
                        {item.source === "localStorage" ? "Storage" : "Cookie"}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="md:col-span-2 border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b flex justify-between items-center">
              <h3 className="font-medium text-sm text-gray-700">
                {selectedItem
                  ? selectedItem.key
                  : "Select an item to view details"}
                {selectedItem && (
                  <span
                    className={`ml-2 text-xs ${
                      selectedItem.source === "localStorage"
                        ? "text-blue-500"
                        : "text-green-500"
                    }`}
                  >
                    (
                    {selectedItem.source === "localStorage"
                      ? "Local Storage"
                      : "Cookie"}
                    )
                  </span>
                )}
              </h3>
              {selectedItem && (
                <button
                  onClick={() =>
                    handleResetItem(selectedItem.key, selectedItem.source)
                  }
                  className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded hover:bg-red-200"
                >
                  Reset
                </button>
              )}
            </div>
            <div className="p-4 overflow-y-auto max-h-96">
              {selectedItem ? (
                <pre className="text-xs whitespace-pre-wrap bg-gray-50 p-3 rounded">
                  {JSON.stringify(selectedItem.value, null, 2)}
                </pre>
              ) : (
                <div className="text-sm text-gray-500 text-center py-8">
                  Select an item from the list to view its contents
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
