import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { subDays, startOfDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { AGE_GROUPS, AgeGroupKey } from "@/constants/ageGroups";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const days = Math.min(
    parseInt(req.nextUrl.searchParams.get("days") || "7"),
    30,
  );

  const child = await prisma.child.findUnique({ where: { id } });
  if (!child) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Child not found" } },
      { status: 404 },
    );
  }

  const since = subDays(new Date(), days);
  const progress = await prisma.dailyProgress.findMany({
    where: { childId: id, date: { gte: since } },
    include: { story: { include: { words: true } } },
    orderBy: { date: "desc" },
  });

  const completionRate =
    progress.length > 0
      ? progress.filter((p) => p.completed).length / progress.length
      : 0;

  const nowIST = toZonedTime(new Date(), "Asia/Kolkata");
  const todayStart = startOfDay(nowIST);
  const todayStory = await prisma.story.findFirst({
    where: {
      ageGroup: child.ageGroup,
      status: "PUBLISHED",
      publishedAt: { gte: todayStart },
    },
    include: { words: true },
  });
  const todayTargetWords =
    todayStory?.words.length ??
    AGE_GROUPS[child.ageGroup as AgeGroupKey].wordsPerDay;

  return NextResponse.json({
    data: {
      progress,
      streak: child.streak,
      longestStreak: child.longestStreak,
      totalWordsLearned: child.totalWordsLearned,
      completionRate: Math.round(completionRate * 100) / 100,
      todayTargetWords,
    },
  });
}
