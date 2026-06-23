import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { templateId } = await request.json();
    if (!templateId) {
      return NextResponse.json({ error: "Missing template ID" }, { status: 400 });
    }

    // Retrieve template
    const template = await prisma.examTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template || !template.isActive) {
      return NextResponse.json({ error: "Đề thi không tồn tại hoặc đã bị khóa." }, { status: 404 });
    }

    // Verify user belongs to same tenant
    if (session.role !== "super-admin" && template.organizationId !== session.organizationId) {
      return NextResponse.json({ error: "Unauthorized tenant access" }, { status: 403 });
    }

    // Check if there is already an ongoing session for this user and template
    const existingSession = await prisma.examSession.findFirst({
      where: {
        templateId,
        userId: session.uid,
        status: "ongoing",
      },
    });

    if (existingSession) {
      // Return existing session for recovery
      return NextResponse.json({
        success: true,
        sessionId: existingSession.id,
        message: "Phục hồi phiên làm bài hiện tại",
      });
    }

    const rules = template.rules as Array<{
      categoryId: string;
      type: string;
      level: string;
      count: number;
    }>;

    let selectedQuestions: any[] = [];

    // Query questions dynamically based on rules matrix
    for (const rule of rules) {
      const dbQuestions = await prisma.question.findMany({
        where: {
          organizationId: template.organizationId,
          categoryId: rule.categoryId,
          type: rule.type,
          level: rule.level,
        },
      });

      if (dbQuestions.length < rule.count) {
        return NextResponse.json(
          {
            error: `Không đủ câu hỏi trong ngân hàng. Cần ${rule.count} câu nhưng chỉ tìm thấy ${dbQuestions.length} câu phù hợp. Vui lòng liên hệ Admin.`,
          },
          { status: 400 }
        );
      }

      // Shuffle and select count
      const shuffled = shuffleArray(dbQuestions);
      const chosen = shuffled.slice(0, rule.count);
      selectedQuestions = [...selectedQuestions, ...chosen];
    }

    // Shuffle the final merged list of questions
    selectedQuestions = shuffleArray(selectedQuestions);

    // Format questions for client (Strip correct answers for anti-cheat/integrity)
    const clientQuestions = selectedQuestions.map((q) => ({
      id: q.id,
      type: q.type,
      level: q.level,
      text: q.text,
      options: q.options, // choices array (null for essay)
    }));

    // Create session record
    const examSession = await prisma.examSession.create({
      data: {
        organizationId: template.organizationId,
        templateId: template.id,
        userId: session.uid,
        startedAt: new Date(),
        status: "ongoing",
        questions: clientQuestions,
        userAnswers: {},
        cheatAttempts: 0,
        cheatLogs: [],
      },
    });

    return NextResponse.json({
      success: true,
      sessionId: examSession.id,
      questions: clientQuestions,
      startedAt: examSession.startedAt,
      duration: template.duration,
    });
  } catch (error: any) {
    console.error("Start Exam Session Error:", error);
    return NextResponse.json({ error: error.message || "Failed to start exam session" }, { status: 500 });
  }
}
