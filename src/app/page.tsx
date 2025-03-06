"use client";

import { ScenarioSelector } from "@/components/landing-page/scenario-selector";
import { CenterControlProvider } from "@/lib/center-control-context";
import { TooltipProvider } from "@/lib/tooltip-context";

export default function Home() {
  return (
    <CenterControlProvider>
      <TooltipProvider>
        <ScenarioSelector />
      </TooltipProvider>
    </CenterControlProvider>
  );
}
