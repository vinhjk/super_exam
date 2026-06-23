import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { prisma } from "@/lib/prisma";
import { setSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    // Extract token from Authorization header first
    let idToken: string | null = null;
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
      idToken = authHeader.substring(7).trim();
    }

    // If not found in header, check body
    if (!idToken) {
      try {
        const body = await request.json();
        idToken = body?.idToken || null;
      } catch (e) {
        // Body was empty or not valid JSON
      }
    }

    // Return 401 early if token is missing or empty
    if (!idToken || idToken.trim() === "") {
      return NextResponse.json(
        { error: "Unauthorized: Missing or empty ID token" },
        { status: 401 }
      );
    }

    // Verify token using Firebase Admin SDK
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (verifyError: any) {
      console.error("Firebase Admin Verification Error:", verifyError);
      const isExpired = verifyError?.code === "auth/id-token-expired";
      const errorMessage = isExpired
        ? "Unauthorized: Firebase ID token has expired"
        : `Unauthorized: Invalid ID token (${verifyError?.message || "unknown error"})`;
      return NextResponse.json(
        { error: errorMessage, code: verifyError?.code || "auth/invalid-token" },
        { status: 401 }
      );
    }

    const { uid, email, name, picture } = decodedToken;

    if (!email) {
      return NextResponse.json({ error: "Token does not contain an email address" }, { status: 400 });
    }

    // Check if user exists in PostgreSQL
    let dbUser = await prisma.user.findUnique({
      where: { id: uid },
      include: { organization: true },
    });

    const initialSuperAdminEmail = process.env.INITIAL_SUPER_ADMIN_EMAIL;
    const isInitialSuperAdmin = !!(
      initialSuperAdminEmail && email.toLowerCase() === initialSuperAdminEmail.toLowerCase()
    );

    if (!dbUser) {
      // Determine if this is the first user or if matches INITIAL_SUPER_ADMIN_EMAIL
      const userCount = await prisma.user.count();
      const role = (userCount === 0 || isInitialSuperAdmin) ? "super-admin" : "user";

      dbUser = await prisma.user.create({
        data: {
          id: uid,
          email: email,
          displayName: name || null,
          photoURL: picture || null,
          role: role,
          organizationId: null,
        },
        include: { organization: true },
      });
    } else if (isInitialSuperAdmin && (dbUser.role !== "super-admin" || dbUser.organizationId !== null)) {
      // Escalation logic: Enforce super-admin role and null organizationId
      dbUser = await prisma.user.update({
        where: { id: uid },
        data: {
          role: "super-admin",
          organizationId: null,
        },
        include: { organization: true },
      });
    }

    // Establish secure session cookie
    const sessionPayload = {
      uid: dbUser.id,
      email: dbUser.email,
      role: dbUser.role,
      organizationId: dbUser.organizationId,
      displayName: dbUser.displayName,
      photoURL: dbUser.photoURL,
    };

    await setSession(sessionPayload);

    return NextResponse.json({ success: true, user: sessionPayload });
  } catch (error: any) {
    console.error("Auth sync error:", error);
    return NextResponse.json({ error: error.message || "Authentication failed" }, { status: 401 });
  }
}
