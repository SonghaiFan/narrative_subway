"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CompletionPage } from "@/components/features/task/completion-page";
import { useAuth } from "@/contexts/auth-context";

export default function CompletionRoute() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [pageData, setPageData] = useState({
    totalTasks: 0,
    correctTasks: 0,
    studyType: "visualization",
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get data from URL parameters
    const totalParam = searchParams.get("total");
    const correctParam = searchParams.get("correct");
    const studyType = searchParams.get("type") || "visualization";

    if (!totalParam || !correctParam) {
      setError("Missing required parameters");
      return;
    }

    const totalTasks = parseInt(totalParam, 10);
    const correctTasks = parseInt(correctParam, 10);

    // Validate the data
    if (isNaN(totalTasks) || totalTasks <= 0) {
      setError("Invalid task count");
      return;
    }

    if (isNaN(correctTasks) || correctTasks < 0 || correctTasks > totalTasks) {
      setError("Invalid correct count");
      return;
    }

    setPageData({
      totalTasks,
      correctTasks,
      studyType,
    });

    // Mark study as completed in localStorage
    localStorage.setItem("studyCompleted", "true");
  }, [searchParams]);

  const handleRestart = () => {
    // Determine which route to go back to based on study type
    const route =
      pageData.studyType === "visualization" ? "/visualization" : "/pure-text";

    router.push(route);
  };

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
        correctTasks={pageData.correctTasks}
        userRole={user?.role as "domain" | "normal"}
        studyType={pageData.studyType}
        onRestart={user?.role === "domain" ? handleRestart : undefined}
      />
    </div>
  );
}
