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
      return NextResponse.json({ error: "No organization assigned" }, { status: 400 });
    }

    const whereClause = session.role === "super-admin" ? {} : { organizationId: orgId! };

    // Fetch counts
    const userCount = await prisma.user.count({ where: whereClause });
    const templateCount = await prisma.examTemplate.count({ where: whereClause });
    const questionCount = await prisma.question.count({ where: whereClause });
    const sessionCount = await prisma.examSession.count({ where: whereClause });

    // Fetch all sessions with user and template names
    const sessions = await prisma.examSession.findMany({
      where: whereClause,
      include: {
        user: {
          select: { displayName: true, email: true },
        },
        template: {
          select: { title: true },
        },
      },
      orderBy: { startedAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      stats: {
        users: userCount,
        templates: templateCount,
        questions: questionCount,
        sessions: sessionCount,
      },
      sessions,
    });
  } catch (error: any) {
    console.error("GET Admin Dashboard Data Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch admin statistics" }, { status: 500 });
  }
}
