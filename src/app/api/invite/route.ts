import { NextRequest, NextResponse } from "next/server";
import { getSession, setSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { inviteCode } = await request.json();
    if (!inviteCode) {
      return NextResponse.json({ error: "Missing invite code" }, { status: 400 });
    }

    // Lookup organization by invite code
    const organization = await prisma.organization.findUnique({
      where: { inviteCode },
    });

    if (!organization) {
      return NextResponse.json({ error: "Mã mời không tồn tại trong hệ thống." }, { status: 404 });
    }

    // Assign organization to user in database
    const updatedUser = await prisma.user.update({
      where: { id: session.uid },
      data: {
        organizationId: organization.id,
      },
    });

    // Update active session cookie with new organization ID
    const updatedSession = {
      ...session,
      organizationId: organization.id,
    };

    await setSession(updatedSession);

    return NextResponse.json({
      success: true,
      user: updatedSession,
      organizationName: organization.name,
    });
  } catch (error: any) {
    console.error("Invite code error:", error);
    return NextResponse.json({ error: error.message || "Invite code verification failed" }, { status: 500 });
  }
}
