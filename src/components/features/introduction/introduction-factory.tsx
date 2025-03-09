"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { IntroductionPage, ScenarioType } from "./introduction-page";

interface IntroductionFactoryProps {
  scenarioType: ScenarioType;
  redirectPath: string;
  cookieName?: string;
  cookieExpiration?: number; // in seconds
}

/**
 * A factory component that creates introduction pages for different scenarios
 * with consistent cookie handling and redirection logic
 */
export function IntroductionFactory({
  scenarioType,
  redirectPath,
  cookieName = "hasCompletedIntro",
  cookieExpiration = 604800, // 7 days by default
}: IntroductionFactoryProps) {
  const router = useRouter();

  // Check if user has already completed introduction
  useEffect(() => {
    const hasCompletedIntro = document.cookie.includes(`${cookieName}=true`);
    if (hasCompletedIntro) {
      router.push(redirectPath);
    }
  }, [router, cookieName, redirectPath]);

  const handleComplete = () => {
    // Set cookie with specified expiration
    document.cookie = `${cookieName}=true; path=/; max-age=${cookieExpiration}`;
    router.push(redirectPath);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="h-full p-4">
        <IntroductionPage
          onComplete={handleComplete}
          scenarioType={scenarioType}
        />
      </div>
    </div>
  );
}
