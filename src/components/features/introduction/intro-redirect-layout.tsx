"use client";

import { ReactNode } from "react";
import { IntroRedirectChecker } from "./intro-redirect-checker";

interface IntroRedirectLayoutProps {
  children: ReactNode;
}

/**
 * A layout component that includes the IntroRedirectChecker
 * This should be used in the layout of pages that require introduction
 */
export function IntroRedirectLayout({ children }: IntroRedirectLayoutProps) {
  return (
    <>
      <IntroRedirectChecker />
      {children}
    </>
  );
}
