import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateStory } from "@/lib/claude";
import { AgeGroupKey } from "@/constants/ageGroups";
import { startOfDay, endOfDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";

export async function GET(req: NextRequest) {
  const ageGroup = req.nextUrl.searchParams.get("ageGroup") as AgeGroupKey;
  if (!ageGroup) {
    return NextResponse.json(
      {
        error: {
          code: "MISSING_AGE_GROUP",
          message: "ageGroup query param required",
        },
      },
      { status: 400 },
    );
  }

  const nowIST = toZonedTime(new Date(), "Asia/Kolkata");
  const dayStart = startOfDay(nowIST);
  const dayEnd = endOfDay(nowIST);

  // Cache-aside: check DB for today's published story (best-effort)
  try {
    const existing = await prisma.story.findFirst({
      where: {
        ageGroup,
        status: "PUBLISHED",
        publishedAt: { gte: dayStart, lte: dayEnd },
      },
      include: { words: { orderBy: { displayOrder: "asc" } } },
    });

    if (existing) {
      return NextResponse.json(
        { data: existing },
        { headers: { "Cache-Control": "public, max-age=3600" } },
      );
    }
  } catch (dbErr) {
    console.warn("DB lookup failed, falling through to generation:", dbErr);
  }

  // Generate via AI
  try {
    const generated = await generateStory(ageGroup);

    // Persist to DB (best-effort — return story even if write fails)
    try {
      const story = await prisma.story.create({
        data: {
          title: generated.title,
          body: generated.body,
          ageGroup,
          status: "PUBLISHED",
          wordCount: generated.words.length,
          generatedAt: new Date(),
          publishedAt: new Date(),
          words: {
            create: generated.words.map((w: Record<string, unknown>) => ({
              word: w.word,
              partOfSpeech: w.partOfSpeech,
              definition: w.definition,
              exampleSentence: w.exampleSentence,
              displayOrder: w.displayOrder,
            })),
          },
        },
        include: { words: { orderBy: { displayOrder: "asc" } } },
      });
      return NextResponse.json(
        { data: story },
        { headers: { "Cache-Control": "public, max-age=3600" } },
      );
    } catch (dbWriteErr) {
      console.warn(
        "DB write failed, returning generated story without persisting:",
        dbWriteErr,
      );
      // Return the generated story directly without an id/timestamps from DB
      return NextResponse.json(
        {
          data: {
            id: null,
            title: generated.title,
            body: generated.body,
            ageGroup,
            status: "PUBLISHED",
            wordCount: generated.words.length,
            generatedAt: new Date().toISOString(),
            publishedAt: new Date().toISOString(),
            words: generated.words.map(
              (w: Record<string, unknown>, i: number) => ({
                id: null,
                storyId: null,
                word: w.word,
                partOfSpeech: w.partOfSpeech,
                definition: w.definition,
                exampleSentence: w.exampleSentence,
                displayOrder: w.displayOrder ?? i,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }),
            ),
          },
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
  } catch (e) {
    console.error("Story generation failed:", e);
    return NextResponse.json(
      {
        error: {
          code: "GENERATION_FAILED",
          message: "Failed to generate story",
        },
      },
      { status: 503 },
    );
  }
}
