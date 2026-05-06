import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const story = await prisma.story.findUnique({
    where: { id },
    include: { words: { orderBy: { displayOrder: "asc" } } },
  });
  if (!story) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Story not found" } },
      { status: 404 },
    );
  }
  return NextResponse.json(
    { data: story },
    { headers: { "Cache-Control": "public, max-age=86400" } },
  );
}
