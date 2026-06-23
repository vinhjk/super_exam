import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ userId: string }> }
) {
  try {
    const params = await props.params;
    const session = await getSession();
    if (!session || session.role !== "super-admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userId } = params;
    const { newRole } = await request.json();

    if (!newRole || (newRole !== "admin" && newRole !== "user")) {
      return NextResponse.json({ error: "Invalid role value" }, { status: 400 });
    }

    // Update user role in DB
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error("PATCH User Role Error:", error);
    return NextResponse.json({ error: error.message || "Failed to update user role" }, { status: 500 });
  }
}
