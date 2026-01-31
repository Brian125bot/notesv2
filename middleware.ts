import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  
  // Check if user is authenticated
  const isAuthenticated = !!sessionCookie;
  
  // Define public routes
  const isPublicRoute = request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/api/auth") ||
    request.nextUrl.pathname === "/manifest.json" ||
    request.nextUrl.pathname.startsWith("/icons/") ||
    request.nextUrl.pathname === "/sw.js";

  // Redirect unauthenticated users to login
  if (!isAuthenticated && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect authenticated users away from login
  if (isAuthenticated && request.nextUrl.pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
