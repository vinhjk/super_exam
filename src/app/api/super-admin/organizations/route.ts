import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

function generateInviteCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const part1 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  const part2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `ORG-${part1}-${part2}`;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "super-admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizations = await prisma.organization.findMany({
      include: {
        _count: {
          select: { users: true, templates: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const totalUsers = await prisma.user.count();

    return NextResponse.json({ organizations, totalUsers });
  } catch (error: any) {
    console.error("GET Organizations Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch organizations" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "super-admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Generate a unique invite code (with retry safety)
    let inviteCode = "";
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      inviteCode = generateInviteCode();
      const existing = await prisma.organization.findUnique({
        where: { inviteCode },
      });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return NextResponse.json({ error: "Failed to generate a unique invite code after multiple attempts" }, { status: 500 });
    }

    const organization = await prisma.organization.create({
      data: {
        name: name.trim(),
        inviteCode,
      },
    });

    return NextResponse.json({ success: true, organization });
  } catch (error: any) {
    console.error("POST Organization Error:", error);
    return NextResponse.json({ error: error.message || "Failed to create organization" }, { status: 500 });
  }
}
