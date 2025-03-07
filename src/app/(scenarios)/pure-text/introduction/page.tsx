"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { IntroductionPage } from "@/components/features/introduction/introduction-page";

export default function PureTextIntroductionPage() {
  const router = useRouter();

  // Check if user has already completed introduction
  useEffect(() => {
    const hasCompletedIntro = document.cookie.includes(
      "hasCompletedIntro=true"
    );
    if (hasCompletedIntro) {
      router.push("/pure-text");
    }
  }, [router]);

  const handleComplete = () => {
    // Set cookie with 7 days expiration
    document.cookie = "hasCompletedIntro=true; path=/; max-age=604800";
    router.push("/pure-text");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="h-full p-4">
        <IntroductionPage onComplete={handleComplete} />
      </div>
    </div>
  );
}
