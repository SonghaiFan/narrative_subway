"use client";

import { IntroductionFactory } from "@/components/features/introduction/introduction-factory";

export default function TextChatIntroductionPage() {
  return (
    <IntroductionFactory scenarioType="text-chat" redirectPath="/text-chat" />
  );
}
