"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { ScenarioSelector } from "@/components/landing-page/scenario-selector";
import { useAuth } from "@/lib/auth-context";

export default function Home() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Redirect normal users to their default scenario
  useEffect(() => {
    if (
      isAuthenticated &&
      user &&
      user.role === "normal" &&
      user.defaultScenario
    ) {
      router.push(`/scenario/${user.defaultScenario}`);
    }
  }, [isAuthenticated, user, router]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin mb-2"></div>
        <div className="text-neutral-600 text-sm">Loading...</div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Narrative Matrix
            </h1>
            <p className="text-sm text-gray-600 mt-1">User Study Platform</p>
          </div>

          <LoginForm />
        </div>
      </main>
    );
  }

  // Show scenario selector for domain users
  if (user && user.role === "domain") {
    return <ScenarioSelector />;
  }

  // Fallback loading state while redirecting normal users
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <div className="w-10 h-10 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin mb-2"></div>
      <div className="text-neutral-600 text-sm">
        Preparing your dashboard...
      </div>
    </div>
  );
}
