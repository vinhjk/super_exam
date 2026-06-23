import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "super-admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = session.organizationId;
    if (!orgId && session.role !== "super-admin") {
      return NextResponse.json({ error: "User is not assigned to an organization" }, { status: 400 });
    }

    const { questions } = await request.json();

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: "Invalid questions list payload" }, { status: 400 });
    }

    // Verify all questions belong to the tenant's categories and have valid fields
    const validatedQuestions = [];

    for (const q of questions) {
      const { categoryId, type, level, text, options, correctAnswers } = q;

      if (!categoryId || !type || !level || !text || !text.trim()) {
        return NextResponse.json({ error: "Each question must contain categoryId, type, level, and text." }, { status: 400 });
      }

      if (type !== "single" && type !== "multi" && type !== "essay") {
        return NextResponse.json({ error: "Invalid question type: " + type }, { status: 400 });
      }

      validatedQuestions.push({
        organizationId: orgId!,
        categoryId,
        type,
        level,
        text: text.trim(),
        options: type !== "essay" ? options : null,
        correctAnswers: type !== "essay" ? correctAnswers : null,
      });
    }

    // Bulk insert using prisma createMany
    const result = await prisma.question.createMany({
      data: validatedQuestions,
    });

    return NextResponse.json({ success: true, count: result.count });
  } catch (error: any) {
    console.error("Bulk Import Questions Error:", error);
    return NextResponse.json({ error: error.message || "Failed to bulk import questions" }, { status: 500 });
  }
}
