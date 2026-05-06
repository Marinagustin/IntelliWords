import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const CreateChildSchema = z.object({
  name: z.string().min(2).max(30),
  ageGroup: z.enum(["SEEDLING", "SPROUT", "SAPLING", "TREE"]),
  avatarEmoji: z.string().optional(),
  parentId: z.string(),
});

export async function GET(req: NextRequest) {
  const parentId = req.nextUrl.searchParams.get("parentId");
  if (!parentId) {
    return NextResponse.json(
      { error: { code: "MISSING_PARENT_ID", message: "parentId required" } },
      { status: 400 },
    );
  }
  const children = await prisma.child.findMany({
    where: { parentId, deletedAt: null },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ data: children });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = CreateChildSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request",
          details: parsed.error.flatten(),
        },
      },
      { status: 422 },
    );
  }
  const child = await prisma.child.create({ data: parsed.data });
  return NextResponse.json({ data: child }, { status: 201 });
}
