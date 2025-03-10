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
    pathname.startsWith("/pure-text") ||
    pathname.startsWith("/text-visual") ||
    pathname.startsWith("/text-chat") ||
    pathname.startsWith("/mixed");

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

      if (pathname.startsWith("/pure-text")) {
        introPath = "/pure-text/introduction";
      } else if (pathname.startsWith("/text-visual")) {
        introPath = "/text-visual/introduction";
      } else if (pathname.startsWith("/text-chat")) {
        introPath = "/text-chat/introduction";
      } else if (pathname.startsWith("/mixed")) {
        introPath = "/mixed/introduction";
      }

      return NextResponse.redirect(new URL(introPath, request.url));
    }
  }

  return NextResponse.next();
}

// Configure middleware to run on specific paths
export const config = {
  matcher: [
    "/pure-text/:path*",
    "/text-visual/:path*",
    "/text-chat/:path*",
    "/mixed/:path*",
    "/completion",
    "/dashboard",
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
