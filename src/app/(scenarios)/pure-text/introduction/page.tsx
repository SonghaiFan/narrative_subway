"use client";

import { IntroductionFactory } from "@/components/features/introduction/introduction-factory";

export default function PureTextIntroductionPage() {
  return (
    <IntroductionFactory scenarioType="pure-text" redirectPath="/pure-text" />
  );
}
