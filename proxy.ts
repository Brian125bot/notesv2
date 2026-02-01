import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Next.js middleware for authentication
 * Protects routes and redirects unauthorized users
 */

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  "/login",
  "/api/auth",
  "/manifest.json",
  "/icons/",
  "/sw.js",
  "/_next/",
  "/favicon.ico",
];

// File extensions that are always public
const PUBLIC_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".css", ".js"];

/**
 * Check if a pathname matches public routes
 */
function isPublicRoute(pathname: string): boolean {
  // Check exact matches
  if (PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(route))) {
    return true;
  }
  
  // Check file extensions
  if (PUBLIC_EXTENSIONS.some((ext) => pathname.endsWith(ext))) {
    return true;
  }
  
  return false;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }
  
  // Check for session cookie
  const sessionCookie = getSessionCookie(request);
  const isAuthenticated = !!sessionCookie;
  
  // Redirect unauthenticated users to login
  if (!isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    // Add return URL for post-login redirect
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // Redirect authenticated users away from login
  if (isAuthenticated && pathname === "/login") {
    const callbackUrl = request.nextUrl.searchParams.get("callbackUrl");
    return NextResponse.redirect(new URL(callbackUrl || "/", request.url));
  }
  
  return NextResponse.next();
}

/**
 * Middleware matcher configuration
 * Only run middleware on specific paths
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
