"use client";

import { IntroductionFactory } from "@/components/features/introduction/introduction-factory";

export default function VisualChatIntroductionPage() {
  return (
    <IntroductionFactory
      scenarioType="visual-chat"
      redirectPath="/visual-chat"
    />
  );
}
