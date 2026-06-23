import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = session.organizationId;
    if (!orgId) {
      return NextResponse.json({ error: "No organization assigned" }, { status: 400 });
    }

    // 1. Fetch active templates
    const templates = await prisma.examTemplate.findMany({
      where: {
        organizationId: orgId,
        isActive: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // 2. Fetch past and ongoing exam sessions of this user
    const sessions = await prisma.examSession.findMany({
      where: {
        userId: session.uid,
        organizationId: orgId,
      },
      include: {
        template: {
          select: { title: true, duration: true },
        },
      },
      orderBy: { startedAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      templates,
      sessions,
    });
  } catch (error: any) {
    console.error("Dashboard Data GET Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch dashboard data" }, { status: 500 });
  }
}
