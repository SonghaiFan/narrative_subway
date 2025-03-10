"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

/**
 * Checks if a localStorage item has expired and removes it if necessary
 * @param key The localStorage key to check
 * @returns boolean indicating if the item is valid (not expired)
 */
function checkLocalStorageExpiration(key: string): boolean {
  try {
    const expirationKey = `${key}_expiration`;
    const expirationTime = localStorage.getItem(expirationKey);

    if (!expirationTime) return true; // No expiration set, consider valid

    const hasExpired = parseInt(expirationTime, 10) < Date.now();

    if (hasExpired) {
      // Clean up expired items
      localStorage.removeItem(key);
      localStorage.removeItem(expirationKey);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error checking localStorage expiration:", error);
    return false; // Consider expired on error
  }
}

/**
 * This component checks if the user has completed the introduction
 * and redirects to the appropriate introduction page if not.
 * It should be included in the layout of pages that require introduction.
 */
export function IntroRedirectChecker() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check if the special header is present
    // This is a workaround since we can't directly check in middleware
    const checkHeader = async () => {
      try {
        // Make a request to the current page to check for the header
        const response = await fetch(window.location.href, {
          method: "HEAD",
          credentials: "same-origin",
        });

        // Check if the header is present
        const shouldCheck =
          response.headers.get("X-Check-Intro-Completion") === "true";

        if (shouldCheck) {
          // Check localStorage for introduction completion
          const cookieName = "hasCompletedIntro";
          const hasCompletedIntro = localStorage.getItem(cookieName) === "true";
          const isValid = checkLocalStorageExpiration(cookieName);

          if (!hasCompletedIntro || !isValid) {
            // Determine which introduction page to redirect to
            let introPath = "/pure-text/introduction"; // Default fallback

            if (pathname.startsWith("/pure-text")) {
              introPath = "/pure-text/introduction";
            } else if (pathname.startsWith("/text-visual")) {
              introPath = "/text-visual/introduction";
            } else if (pathname.startsWith("/text-chat")) {
              introPath = "/text-chat/introduction";
            } else if (pathname.startsWith("/mixed")) {
              introPath = "/mixed/introduction";
            }

            // Redirect to the appropriate introduction page
            router.push(introPath);
          }
        }
      } catch (error) {
        console.error("Error checking introduction completion:", error);
      }
    };

    checkHeader();
  }, [pathname, router]);

  // This component doesn't render anything
  return null;
}
