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
        <div className="w-16 h-16 border-4 border-neutral-300 border-t-neutral-600 rounded-full animate-spin mb-4"></div>
        <div className="text-neutral-600 font-medium">Loading...</div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Narrative Matrix
            </h1>
            <p className="text-gray-600 mt-2">User Study Platform</p>
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
      <div className="w-16 h-16 border-4 border-neutral-300 border-t-neutral-600 rounded-full animate-spin mb-4"></div>
      <div className="text-neutral-600 font-medium">
        Preparing your dashboard...
      </div>
    </div>
  );
}
