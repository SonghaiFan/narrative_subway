import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip middleware for completion page and dashboard
  if (pathname.startsWith("/completion") || pathname === "/dashboard") {
    return NextResponse.next();
  }

  // Check if the route requires introduction
  const requiresIntro =
    pathname.startsWith("/visualization") ||
    pathname.startsWith("/pure-text") ||
    pathname.startsWith("/text-chat") ||
    pathname.startsWith("/visual-chat");

  if (requiresIntro) {
    // Skip middleware for introduction pages
    if (pathname.endsWith("/introduction")) {
      return NextResponse.next();
    }

    // Check if user has completed introduction
    const hasCompletedIntro =
      request.cookies.get("hasCompletedIntro")?.value === "true";

    // If not completed, redirect to appropriate introduction page
    if (!hasCompletedIntro) {
      let introPath = "/pure-text/introduction"; // Default fallback path

      if (pathname.startsWith("/visualization")) {
        introPath = "/visualization/introduction";
      } else if (pathname.startsWith("/pure-text")) {
        introPath = "/pure-text/introduction";
      } else if (pathname.startsWith("/text-chat")) {
        introPath = "/text-chat/introduction";
      } else if (pathname.startsWith("/visual-chat")) {
        introPath = "/visual-chat/introduction";
      }

      return NextResponse.redirect(new URL(introPath, request.url));
    }
  }

  return NextResponse.next();
}

// Configure middleware to run on specific paths
export const config = {
  matcher: [
    "/visualization/:path*",
    "/pure-text/:path*",
    "/text-chat/:path*",
    "/visual-chat/:path*",
    "/completion",
    "/dashboard",
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
