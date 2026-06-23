import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId, userAnswers: finalUserAnswers } = await request.json();
    if (!sessionId) {
      return NextResponse.json({ error: "Missing session ID" }, { status: 400 });
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

    // Check if already submitted
    if (examSession.status !== "ongoing") {
      return NextResponse.json({ error: "Bài thi đã được nộp trước đó." }, { status: 400 });
    }

    // Use answers provided in payload, fallback to database state if absent
    const answers = finalUserAnswers || examSession.userAnswers || {};

    const sessionQuestions = examSession.questions as Array<{
      id: string;
      type: string;
      text: string;
      options: string[] | null;
    }>;

    // Fetch original questions from PostgreSQL to retrieve correct answers
    const questionIds = sessionQuestions.map((q) => q.id);
    const dbQuestions = await prisma.question.findMany({
      where: { id: { in: questionIds } },
    });

    const dbQuestionsMap = new Map<string, any>();
    dbQuestions.forEach((q) => dbQuestionsMap.set(q.id, q));

    let correctCount = 0;
    let containsEssay = false;
    let mcqCount = 0;

    for (const q of sessionQuestions) {
      const dbQ = dbQuestionsMap.get(q.id);
      if (!dbQ) continue;

      if (q.type === "essay") {
        containsEssay = true;
      } else {
        mcqCount++;
        const userAnswer = answers[q.id]; // can be array of indices or single number
        const correctAnswers = dbQ.correctAnswers as number[]; // correct indices array

        if (userAnswer !== undefined && correctAnswers) {
          // Compare answers
          if (q.type === "single") {
            // For single choice, userAnswer can be a single index (number) or array [index]
            const uAnsIndex = Array.isArray(userAnswer) ? userAnswer[0] : userAnswer;
            const cAnsIndex = Array.isArray(correctAnswers) ? correctAnswers[0] : correctAnswers;

            if (Number(uAnsIndex) === Number(cAnsIndex)) {
              correctCount++;
            }
          } else if (q.type === "multi") {
            // For multi-choice, both must be arrays and contain identical elements
            const uAnsArray = Array.isArray(userAnswer) ? userAnswer.map(Number).sort() : [Number(userAnswer)].sort();
            const cAnsArray = Array.isArray(correctAnswers) ? correctAnswers.map(Number).sort() : [];

            if (
              uAnsArray.length === cAnsArray.length &&
              uAnsArray.every((val, idx) => val === cAnsArray[idx])
            ) {
              correctCount++;
            }
          }
        }
      }
    }

    // Compute status and score
    let status = "graded";
    let score: number | null = null;

    if (containsEssay) {
      status = "pending_review";
      // Temporary score contains only MCQ points, but actual final score will be published after essay review
      // Let's store score as null to signify pending status, or save MCQ portion
    } else {
      // Scale score out of 10 points
      score = sessionQuestions.length > 0 ? (correctCount / sessionQuestions.length) * 10 : 0;
      // round to 2 decimal places
      score = Math.round((score + Number.EPSILON) * 100) / 100;
    }

    // Update database session
    const updatedSession = await prisma.examSession.update({
      where: { id: sessionId },
      data: {
        status,
        submittedAt: new Date(),
        userAnswers: answers,
        score,
      },
    });

    return NextResponse.json({
      success: true,
      status,
      score,
      submittedAt: updatedSession.submittedAt,
    });
  } catch (error: any) {
    console.error("Submit Exam Session Error:", error);
    return NextResponse.json({ error: error.message || "Failed to submit exam" }, { status: 500 });
  }
}
