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

    const categories = await prisma.category.findMany({
      where: session.role === "super-admin" ? {} : { organizationId: orgId! },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ categories });
  } catch (error: any) {
    console.error("GET Categories Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch categories" }, { status: 500 });
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

    const { name, targetOrgId } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const finalOrgId = session.role === "super-admin" ? targetOrgId : orgId;

    if (!finalOrgId) {
      return NextResponse.json({ error: "Organization ID is required" }, { status: 400 });
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        organizationId: finalOrgId,
      },
    });

    return NextResponse.json({ success: true, category });
  } catch (error: any) {
    console.error("POST Category Error:", error);
    return NextResponse.json({ error: error.message || "Failed to create category" }, { status: 500 });
  }
}
