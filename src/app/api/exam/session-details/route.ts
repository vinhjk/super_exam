import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId parameter" }, { status: 400 });
    }

    const examSession = await prisma.examSession.findUnique({
      where: { id: sessionId },
      include: {
        template: {
          select: { title: true, duration: true },
        },
      },
    });

    if (!examSession) {
      return NextResponse.json({ error: "Exam session not found" }, { status: 404 });
    }

    if (examSession.userId !== session.uid) {
      return NextResponse.json({ error: "Forbidden access" }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      title: examSession.template.title,
      duration: examSession.template.duration,
      startedAt: examSession.startedAt,
      submittedAt: examSession.submittedAt,
      status: examSession.status,
      questions: examSession.questions,
      userAnswers: examSession.userAnswers,
    });
  } catch (error: any) {
    console.error("GET Session Details Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch session details" }, { status: 500 });
  }
}
