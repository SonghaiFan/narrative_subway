"use client";

import { IntroductionFactory } from "@/components/features/introduction/introduction-factory";

export default function VisualizationIntroductionPage() {
  return (
    <IntroductionFactory
      scenarioType="text-visual"
      redirectPath="/text-visual"
    />
  );
}
