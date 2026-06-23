import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId, eventDescription } = await request.json();
    if (!sessionId || !eventDescription) {
      return NextResponse.json({ error: "Missing sessionId or event description" }, { status: 400 });
    }

    // Lookup session
    const examSession = await prisma.examSession.findUnique({
      where: { id: sessionId },
    });

    if (!examSession) {
      return NextResponse.json({ error: "Exam session not found" }, { status: 404 });
    }

    if (examSession.userId !== session.uid) {
      return NextResponse.json({ error: "Forbidden access" }, { status: 403 });
    }

    if (examSession.status !== "ongoing") {
      return NextResponse.json({ error: "Exam is already completed" }, { status: 400 });
    }

    // Get current logs list and append
    const currentLogs = Array.isArray(examSession.cheatLogs)
      ? (examSession.cheatLogs as string[])
      : [];

    const newLog = `[${new Date().toISOString()}] ${eventDescription}`;
    const updatedLogs = [...currentLogs, newLog];

    // Increment cheatAttempts counter and update logs
    await prisma.examSession.update({
      where: { id: sessionId },
      data: {
        cheatAttempts: {
          increment: 1,
        },
        cheatLogs: updatedLogs,
      },
    });

    return NextResponse.json({
      success: true,
      cheatAttempts: examSession.cheatAttempts + 1,
    });
  } catch (error: any) {
    console.error("Log Cheat Event Error:", error);
    return NextResponse.json({ error: error.message || "Failed to log cheat event" }, { status: 500 });
  }
}
