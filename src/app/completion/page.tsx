"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CompletionPage } from "@/components/features/task/completion-page";
import { useAuth } from "@/contexts/auth-context";
import { getTaskProgress } from "@/lib/task-progress";

export default function CompletionRoute() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [pageData, setPageData] = useState({
    totalTasks: 0,
    studyType: "visualization",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If user is not authenticated, redirect to login
    if (!user) {
      router.push("/");
      return;
    }

    // For normal users, check if they have completed tasks
    if (user.role === "normal") {
      const progress = getTaskProgress(user.id);

      // If normal user hasn't completed tasks, redirect to their default scenario
      if (!progress?.isCompleted) {
        // Check if we have URL parameters that might indicate a direct navigation
        const totalParam = searchParams.get("total");

        // If no parameters and no completed tasks, redirect to appropriate scenario
        if (!totalParam) {
          const routeMap: Record<string, string> = {
            "pure-text": "/pure-text",
            visualization: "/visualization",
            "pure-text-chat": "/pure-text/chat",
            "visualization-chat": "/visualization/chat",
          };

          const defaultScenario = user.defaultScenario || "visualization";
          router.push(routeMap[defaultScenario] || "/");
          return;
        }
      }
    }

    // Get data from URL parameters or local storage
    const totalParam = searchParams.get("total");
    const studyType = searchParams.get("type") || "visualization";

    if (totalParam) {
      // If URL parameters exist, use them
      const totalTasks = parseInt(totalParam, 10);

      // Validate the data
      if (isNaN(totalTasks) || totalTasks <= 0) {
        setError("Invalid task count");
        setLoading(false);
        return;
      }

      setPageData({
        totalTasks,
        studyType,
      });
      setLoading(false);
    } else if (user) {
      // Try to get data from local storage
      const progress = getTaskProgress(user.id);

      if (progress) {
        setPageData({
          totalTasks: progress.totalTasks,
          studyType: progress.studyType,
        });
        setLoading(false);
      } else {
        setError("No completion data found");
        setLoading(false);
      }
    } else {
      setError("Missing required parameters");
      setLoading(false);
    }
  }, [searchParams, user, router]);

  const handleRestart = () => {
    // Determine which route to go back to based on study type
    const route =
      pageData.studyType === "visualization" ? "/visualization" : "/pure-text";

    router.push(route);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-12 h-12 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Show error message if parameters are invalid
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-sm p-4 max-w-md w-full">
          <h1 className="text-lg font-medium text-red-600 mb-2">Error</h1>
          <p className="text-sm text-gray-700 mb-3">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="w-full py-2 px-4 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <CompletionPage
        totalTasks={pageData.totalTasks}
        userRole={user?.role as "domain" | "normal"}
        studyType={pageData.studyType}
        onRestart={user?.role === "domain" ? handleRestart : undefined}
      />
    </div>
  );
}
