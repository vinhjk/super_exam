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
    if (!orgId && session.role !== "super-admin") {
      return NextResponse.json({ error: "User is not assigned to an organization" }, { status: 400 });
    }

    // Admins and super-admins see all templates. Candidates only see active templates.
    const isAdmin = session.role === "admin" || session.role === "super-admin";
    const whereClause = isAdmin
      ? (session.role === "super-admin" ? {} : { organizationId: orgId! })
      : { organizationId: orgId!, isActive: true };

    const templates = await prisma.examTemplate.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ templates });
  } catch (error: any) {
    console.error("GET Templates Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch templates" }, { status: 500 });
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

    const { id, title, duration, isActive, rules } = await request.json();

    if (!title || !title.trim() || duration === undefined || !rules || !Array.isArray(rules)) {
      return NextResponse.json({ error: "Missing required template fields" }, { status: 400 });
    }

    // Validate rules matrix entries
    for (const rule of rules) {
      const { categoryId, type, level, count } = rule;
      if (!categoryId || !type || !level || count === undefined || count <= 0) {
        return NextResponse.json({ error: "Each rule in matrix builder must contain categoryId, type, level, and count > 0" }, { status: 400 });
      }
    }

    let template;

    if (id) {
      // Edit existing
      template = await prisma.examTemplate.update({
        where: { id },
        data: {
          title: title.trim(),
          duration: parseInt(duration, 10),
          isActive: !!isActive,
          rules: rules,
        },
      });
    } else {
      // Create new
      template = await prisma.examTemplate.create({
        data: {
          organizationId: orgId!,
          title: title.trim(),
          duration: parseInt(duration, 10),
          isActive: !!isActive,
          rules: rules,
        },
      });
    }

    return NextResponse.json({ success: true, template });
  } catch (error: any) {
    console.error("POST Template Error:", error);
    return NextResponse.json({ error: error.message || "Failed to save template" }, { status: 500 });
  }
}
