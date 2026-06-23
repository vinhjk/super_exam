import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const session = await getSession();
    if (!session || session.role !== "super-admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = params.id;

    // Fetch organization details
    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Fetch users belonging to organization
    const users = await prisma.user.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ organization, users });
  } catch (error: any) {
    console.error("GET Org Users Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch organization users" }, { status: 500 });
  }
}
