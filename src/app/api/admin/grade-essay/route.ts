import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "super-admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId, essayScores } = await request.json();
    if (!sessionId || !essayScores || typeof essayScores !== "object") {
      return NextResponse.json({ error: "Missing sessionId or essayScores map" }, { status: 400 });
    }

    // Lookup session
    const examSession = await prisma.examSession.findUnique({
      where: { id: sessionId },
    });

    if (!examSession) {
      return NextResponse.json({ error: "Exam session not found" }, { status: 404 });
    }

    // Verify tenant bounds
    if (session.role !== "super-admin" && examSession.organizationId !== session.organizationId) {
      return NextResponse.json({ error: "Forbidden access" }, { status: 403 });
    }

    if (examSession.status !== "pending_review") {
      return NextResponse.json({ error: "Bài thi không ở trạng thái cần chấm điểm tự luận." }, { status: 400 });
    }

    const sessionQuestions = examSession.questions as Array<{
      id: string;
      type: string;
      text: string;
      options: string[] | null;
    }>;

    // Fetch original questions for grading MCQs
    const questionIds = sessionQuestions.map((q) => q.id);
    const dbQuestions = await prisma.question.findMany({
      where: { id: { in: questionIds } },
    });

    const dbQuestionsMap = new Map<string, any>();
    dbQuestions.forEach((q) => dbQuestionsMap.set(q.id, q));

    const userAnswers = examSession.userAnswers as Record<string, any>;
    let totalScoreWeight = 0;

    for (const q of sessionQuestions) {
      const dbQ = dbQuestionsMap.get(q.id);
      if (!dbQ) continue;

      if (q.type === "essay") {
        // Essay score multiplier: value in range [0, 1] provided by admin (e.g. 8/10 -> 0.8)
        const rawScore = essayScores[q.id] || 0; // value from 0 to 10
        const multiplier = Math.min(Math.max(Number(rawScore) / 10, 0), 1);
        totalScoreWeight += multiplier;
      } else {
        const userAnswer = userAnswers[q.id];
        const correctAnswers = dbQ.correctAnswers as number[];

        if (userAnswer !== undefined && correctAnswers) {
          if (q.type === "single") {
            const uAnsIndex = Array.isArray(userAnswer) ? userAnswer[0] : userAnswer;
            const cAnsIndex = Array.isArray(correctAnswers) ? correctAnswers[0] : correctAnswers;
            if (Number(uAnsIndex) === Number(cAnsIndex)) {
              totalScoreWeight += 1.0;
            }
          } else if (q.type === "multi") {
            const uAnsArray = Array.isArray(userAnswer) ? userAnswer.map(Number).sort() : [Number(userAnswer)].sort();
            const cAnsArray = Array.isArray(correctAnswers) ? correctAnswers.map(Number).sort() : [];
            if (
              uAnsArray.length === cAnsArray.length &&
              uAnsArray.every((val, idx) => val === cAnsArray[idx])
            ) {
              totalScoreWeight += 1.0;
            }
          }
        }
      }
    }

    // Compute final scaled score
    let finalScore = sessionQuestions.length > 0 ? (totalScoreWeight / sessionQuestions.length) * 10 : 0;
    finalScore = Math.round((finalScore + Number.EPSILON) * 100) / 100;

    // Update session
    await prisma.examSession.update({
      where: { id: sessionId },
      data: {
        status: "graded",
        score: finalScore,
        gradedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, score: finalScore });
  } catch (error: any) {
    console.error("Grade Essay Error:", error);
    return NextResponse.json({ error: error.message || "Failed to grade essays" }, { status: 500 });
  }
}
