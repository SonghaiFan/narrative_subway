import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip middleware for completion page
  if (pathname.startsWith("/completion")) {
    return NextResponse.next();
  }

  // Check if the route requires introduction
  const requiresIntro =
    pathname.startsWith("/visualization") || pathname.startsWith("/pure-text");

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
      const introPath = pathname.startsWith("/visualization")
        ? "/visualization/introduction"
        : "/pure-text/introduction";

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
    "/completion",
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
