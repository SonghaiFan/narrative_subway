"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCenterControl } from "@/contexts/center-control-context";
import { AuthHeader } from "@/components/features/auth/auth-header";
import { ProfileSection } from "@/components/features/dashboard/profile-section";
import { ScenarioCard } from "@/components/features/dashboard/scenario-card";
import { UserDataViewer } from "@/components/features/dashboard/local-storage-viewer";
import { useAuth } from "@/contexts/auth-context";
import { ScenarioSelector } from "@/components/features/dashboard/scenario-selector";

export type ScenarioType = "pure-text" | "text-visual" | "text-chat" | "mixed";

export interface ScenarioCardProps {
  title: string;
  description: string;
  imageSrc: string;
  onClick: () => void;
  isSelected: boolean;
}

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [showStorageViewer, setShowStorageViewer] = useState(false);

  // Protect the dashboard page
  useEffect(() => {
    if (!isLoading && (!user || user.role !== "domain")) {
      router.push("/");
    }
  }, [user, isLoading, router]);

  const handleToggleUserData = () => {
    setShowStorageViewer(!showStorageViewer);
  };

  // Show loading state while checking authentication
  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-3 border-neutral-300 border-t-neutral-600 rounded-full animate-spin mb-2"></div>
        <div className="text-neutral-600 text-sm">Loading...</div>
      </div>
    );
  }

  // Only domain users should reach this point
  return (
    <div className="min-h-screen bg-gray-50">
      <AuthHeader
        title="Domain Expert Dashboard"
        onToggleUserData={handleToggleUserData}
        showUserData={showStorageViewer}
      />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {showStorageViewer && <UserDataViewer />}

        <ScenarioSelector />
      </div>
    </div>
  );
}
