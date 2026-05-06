import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { toZonedTime } from "date-fns-tz";
import { startOfDay, endOfDay, differenceInCalendarDays } from "date-fns";

const ProgressSchema = z.object({
  childId: z.string(),
  storyId: z.string(),
  wordsViewed: z.number().int().min(0),
  timeSpentSeconds: z.number().int().min(0),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = ProgressSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid request" } },
      { status: 422 },
    );
  }

  const { childId, storyId, wordsViewed, timeSpentSeconds } = parsed.data;
  const nowIST = toZonedTime(new Date(), "Asia/Kolkata");
  const dayStart = startOfDay(nowIST);
  const dayEnd = endOfDay(nowIST);

  const story = await prisma.story.findUnique({ where: { id: storyId } });
  if (!story?.publishedAt) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_STORY",
          message: "Story not found or not published",
        },
      },
      { status: 422 },
    );
  }
  const storyDateIST = toZonedTime(story.publishedAt, "Asia/Kolkata");
  if (storyDateIST < dayStart || storyDateIST > dayEnd) {
    return NextResponse.json(
      {
        error: { code: "WRONG_DATE", message: "Story was not published today" },
      },
      { status: 422 },
    );
  }

  const progress = await prisma.dailyProgress.upsert({
    where: { childId_date: { childId, date: dayStart } },
    update: { wordsViewed, timeSpentSeconds, completed: true },
    create: {
      childId,
      storyId,
      date: dayStart,
      wordsViewed,
      timeSpentSeconds,
      completed: true,
    },
  });

  const child = await prisma.child.findUnique({ where: { id: childId } });
  if (child) {
    const lastActive = child.lastActiveDate;
    const daysSinceLast = lastActive
      ? differenceInCalendarDays(
          nowIST,
          toZonedTime(lastActive, "Asia/Kolkata"),
        )
      : null;

    const newStreak =
      daysSinceLast === null || daysSinceLast > 1
        ? 1
        : daysSinceLast === 1
          ? child.streak + 1
          : child.streak;

    await prisma.child.update({
      where: { id: childId },
      data: {
        streak: newStreak,
        longestStreak: Math.max(newStreak, child.longestStreak),
        lastActiveDate: new Date(),
        totalWordsLearned: { increment: wordsViewed },
      },
    });
  }

  return NextResponse.json({ data: progress });
}
