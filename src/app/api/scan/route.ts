import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { extractDifficultWords } from "@/lib/claude";
import { AgeGroupKey } from "@/constants/ageGroups";
import { z } from "zod";

const ScanSchema = z.object({
  text: z.string().min(1).max(2000),
  ageGroup: z.enum(["SEEDLING", "SPROUT", "SAPLING", "TREE"]),
  childId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = ScanSchema.safeParse(body);

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

  const { text, ageGroup, childId } = parsed.data;

  if (text.trim().length < 20) {
    return NextResponse.json({ data: { sessionId: null, words: [] } });
  }

  const words = await extractDifficultWords(ageGroup as AgeGroupKey, text);

  if (childId) {
    const session = await prisma.scanSession.create({
      data: {
        childId,
        originalText: text,
        ageGroup,
        wordCount: words.length,
        words: {
          create: words.map((w) => ({
            word: w.word,
            partOfSpeech: w.partOfSpeech,
            definition: w.definition,
            exampleSentence: w.exampleSentence,
            displayOrder: w.displayOrder,
          })),
        },
      },
    });
    return NextResponse.json({ data: { sessionId: session.id, words } });
  }

  return NextResponse.json({ data: { sessionId: null, words } });
}
