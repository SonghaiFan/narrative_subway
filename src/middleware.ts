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

    // IMPORTANT: We can't check localStorage in middleware because it runs on the server
    // Instead, we'll set a special cookie in the response that will be checked client-side
    // This is a workaround since middleware can't access localStorage directly

    // Create a response that will continue to the destination
    const response = NextResponse.next();

    // Add a special header that our client-side code can check
    // This header tells the client to check localStorage for introduction completion
    response.headers.set("X-Check-Intro-Completion", "true");

    return response;
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
