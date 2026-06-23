import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decrypt, SessionPayload } from "./lib/session";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get("session")?.value;

  const redirect = (path: string) => {
    return NextResponse.redirect(new URL(path, request.url));
  };

  // 1. Handle unauthenticated states
  if (!sessionCookie) {
    const isProtectedRoute =
      pathname.startsWith("/admin") ||
      pathname.startsWith("/super-admin") ||
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/exam") ||
      pathname.startsWith("/join");

    if (isProtectedRoute) {
      return redirect("/login");
    }
    return NextResponse.next();
  }

  // 2. Handle authenticated state decryption
  let session: SessionPayload | null = null;
  try {
    const decrypted = decrypt(sessionCookie);
    session = JSON.parse(decrypted) as SessionPayload;
  } catch (error) {
    console.error("Failed to decrypt session cookie inside proxy:", error);
    const response = redirect("/login");
    response.cookies.delete("session");
    return response;
  }

  if (!session) {
    const response = redirect("/login");
    response.cookies.delete("session");
    return response;
  }

  // 3. User is authenticated, block login page
  if (pathname === "/login") {
    if (session.role === "super-admin") return redirect("/super-admin/dashboard");
    if (session.role === "admin") return redirect("/admin/dashboard");
    if (!session.organizationId) return redirect("/join");
    return redirect("/dashboard");
  }

  // 4. Force new organization users to join portal (skip super-admins)
  if (!session.organizationId && session.role !== "super-admin") {
    if (pathname !== "/join") {
      return redirect("/join");
    }
    return NextResponse.next();
  }

  // 5. Restrict joined users from visiting /join
  if (session.organizationId && pathname === "/join") {
    if (session.role === "admin") return redirect("/admin/dashboard");
    return redirect("/dashboard");
  }

  // 6. Role checking on administrative paths
  if (pathname.startsWith("/super-admin") && session.role !== "super-admin") {
    if (session.role === "admin") return redirect("/admin/dashboard");
    return redirect("/dashboard");
  }

  if (pathname.startsWith("/admin") && session.role !== "admin" && session.role !== "super-admin") {
    return redirect("/dashboard");
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
