import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "super-admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = session.organizationId;
    if (!orgId && session.role !== "super-admin") {
      return NextResponse.json({ error: "User is not assigned to an organization" }, { status: 400 });
    }

    const questions = await prisma.question.findMany({
      where: session.role === "super-admin" ? {} : { organizationId: orgId! },
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ questions });
  } catch (error: any) {
    console.error("GET Questions Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch questions" }, { status: 500 });
  }
}

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

    const body = await request.json();
    const { categoryId, type, level, text, options, correctAnswers } = body;

    if (!categoryId || !type || !level || !text || !text.trim()) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify type
    if (type !== "single" && type !== "multi" && type !== "essay") {
      return NextResponse.json({ error: "Invalid question type" }, { status: 400 });
    }

    // Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category || (session.role !== "super-admin" && category.organizationId !== orgId)) {
      return NextResponse.json({ error: "Invalid category selection" }, { status: 400 });
    }

    const question = await prisma.question.create({
      data: {
        organizationId: session.role === "super-admin" ? category.organizationId : orgId!,
        categoryId,
        type,
        level,
        text: text.trim(),
        options: type !== "essay" ? options : null,
        correctAnswers: type !== "essay" ? correctAnswers : null,
      },
    });

    return NextResponse.json({ success: true, question });
  } catch (error: any) {
    console.error("POST Question Error:", error);
    return NextResponse.json({ error: error.message || "Failed to create question" }, { status: 500 });
  }
}
