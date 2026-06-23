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

    // Verify session owner or admin
    const isAdmin = session.role === "admin" || session.role === "super-admin";
    if (examSession.userId !== session.uid && !isAdmin) {
      return NextResponse.json({ error: "Forbidden access" }, { status: 403 });
    }

    if (examSession.status !== "graded" && !isAdmin) {
      return NextResponse.json({ error: "Bài thi chưa chấm xong, chưa thể xem kết quả." }, { status: 400 });
    }

    const sessionQuestions = examSession.questions as any[];
    const questionIds = sessionQuestions.map((q) => q.id);

    // Fetch correct answers
    const dbQuestions = await prisma.question.findMany({
      where: { id: { in: questionIds } },
      select: { id: true, correctAnswers: true },
    });

    const correctAnswersMap = new Map<string, number[]>();
    dbQuestions.forEach((q) => {
      correctAnswersMap.set(q.id, (q.correctAnswers as number[]) || []);
    });

    const enrichedQuestions = sessionQuestions.map((q) => ({
      ...q,
      correctAnswers: correctAnswersMap.get(q.id) || null,
    }));

    return NextResponse.json({
      success: true,
      title: examSession.template.title,
      score: examSession.score,
      status: examSession.status,
      userAnswers: examSession.userAnswers,
      questions: enrichedQuestions,
      startedAt: examSession.startedAt,
      submittedAt: examSession.submittedAt,
      cheatAttempts: examSession.cheatAttempts,
    });
  } catch (error: any) {
    console.error("GET Review Details Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch review data" }, { status: 500 });
  }
}
