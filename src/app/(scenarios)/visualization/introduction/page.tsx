"use client";

import { IntroductionFactory } from "@/components/features/introduction/introduction-factory";

export default function VisualizationIntroductionPage() {
  return (
    <IntroductionFactory scenarioType="visual" redirectPath="/visualization" />
  );
}
