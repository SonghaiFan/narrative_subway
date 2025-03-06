"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { CenterControlProvider } from "@/lib/center-control-context";
import { TooltipProvider } from "@/lib/tooltip-context";
import { AuthHeader } from "@/components/auth/auth-header";

interface ScenarioLayoutProps {
  children: ReactNode;
  title: string;
  isLoading?: boolean;
}

export function ScenarioLayout({
  children,
  title,
  isLoading = false,
}: ScenarioLayoutProps) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [authLoading, isAuthenticated, router]);

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-3 border-neutral-300 border-t-neutral-600 rounded-full animate-spin mb-2"></div>
        <div className="text-neutral-600 text-sm">
          Checking authentication...
        </div>
      </div>
    );
  }

  // Show loading overlay for data loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-3 border-neutral-300 border-t-neutral-600 rounded-full animate-spin mb-2"></div>
        <div className="text-neutral-600 text-sm">Loading data...</div>
      </div>
    );
  }

  return (
    <CenterControlProvider>
      <TooltipProvider>
        <div className="h-screen w-screen bg-gray-50 flex flex-col">
          {/* Header */}
          <AuthHeader title={title} />

          {/* Main content - removed overflow-hidden to allow proper rendering of nested components */}
          <div className="flex-1 flex">{children}</div>
        </div>
      </TooltipProvider>
    </CenterControlProvider>
  );
}
