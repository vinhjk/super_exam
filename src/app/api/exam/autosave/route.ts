import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId, userAnswers } = await request.json();
    if (!sessionId || !userAnswers) {
      return NextResponse.json({ error: "Missing sessionId or answers payload" }, { status: 400 });
    }

    // Lookup session
    const examSession = await prisma.examSession.findUnique({
      where: { id: sessionId },
    });

    if (!examSession) {
      return NextResponse.json({ error: "Exam session not found" }, { status: 404 });
    }

    // Verify session ownership
    if (examSession.userId !== session.uid) {
      return NextResponse.json({ error: "Forbidden access" }, { status: 403 });
    }

    // Enforce ongoing status constraints
    if (examSession.status !== "ongoing") {
      return NextResponse.json({ error: "Bài thi đã nộp, không thể lưu thêm đáp án." }, { status: 400 });
    }

    // Write answers to PostgreSQL
    const updated = await prisma.examSession.update({
      where: { id: sessionId },
      data: {
        userAnswers: userAnswers,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Auto-save Answers Error:", error);
    return NextResponse.json({ error: error.message || "Failed to auto-save answers" }, { status: 500 });
  }
}
