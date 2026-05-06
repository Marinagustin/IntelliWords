import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const WordTapSchema = z
  .object({
    childId: z.string().optional(),
    word: z.string(),
    source: z.enum(["STORY", "SCAN"]),
    storyId: z.string().optional(),
  })
  .refine((data) => !(data.source === "STORY" && !data.storyId), {
    message: "storyId is required when source is STORY",
  });

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = WordTapSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: parsed.error.issues[0]?.message ?? "Invalid request",
        },
      },
      { status: 400 },
    );
  }
  await prisma.wordEvent.create({ data: parsed.data });
  return NextResponse.json({ data: { ok: true } });
}
