import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const UpdateChildSchema = z.object({
  name: z.string().min(2).max(30).optional(),
  ageGroup: z.enum(["SEEDLING", "SPROUT", "SAPLING", "TREE"]).optional(),
  avatarEmoji: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const child = await prisma.child.findUnique({
    where: { id, deletedAt: null },
  });
  if (!child) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Child not found" } },
      { status: 404 },
    );
  }
  return NextResponse.json({ data: child });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();
  const parsed = UpdateChildSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid request" } },
      { status: 422 },
    );
  }
  const child = await prisma.child.update({
    where: { id },
    data: parsed.data,
  });
  return NextResponse.json({ data: child });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await prisma.child.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  return NextResponse.json({ data: { ok: true } });
}
