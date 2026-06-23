import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: "Missing session ID" }, { status: 400 });
    }

    // Find the session and ensure it belongs to the user and is ongoing
    const examSession = await prisma.examSession.findUnique({
      where: { id: sessionId },
    });

    if (!examSession) {
      return NextResponse.json({ error: "Exam session not found" }, { status: 404 });
    }

    if (examSession.userId !== session.uid) {
      return NextResponse.json({ error: "Forbidden: You do not own this exam session" }, { status: 403 });
    }

    if (examSession.status !== "ongoing") {
      return NextResponse.json(
        { error: "Cannot abort an exam session that is already submitted or graded" },
        { status: 400 }
      );
    }

    // Delete the session record
    await prisma.examSession.delete({
      where: { id: sessionId },
    });

    return NextResponse.json({ success: true, message: "Exam session aborted successfully" });
  } catch (error: any) {
    console.error("Abort exam session error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to abort exam session" },
      { status: 500 }
    );
  }
}
