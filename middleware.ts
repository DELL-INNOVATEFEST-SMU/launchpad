import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware to handle authentication for protected routes
 * This provides an additional layer of security at the edge
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if the request is for a protected route
  const isProtectedRoute = pathname.startsWith("/dashboard") || 
                          pathname.startsWith("/case-assistant") || 
                          pathname.startsWith("/outreach") || 
                          pathname.startsWith("/search");
  
  // Check for admin session cookie
  const adminSession = request.cookies.get("admin_session");
  
  // If accessing protected route without session, redirect to login
  if (isProtectedRoute && !adminSession?.value) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  
  // If accessing login page with valid session, redirect to dashboard
  if (pathname === "/" && adminSession?.value) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
