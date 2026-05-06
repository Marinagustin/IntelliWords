"use client";

import { format, subDays, startOfDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { useProgress } from "@/hooks/useProgress";
import StreakBadge from "@/components/ui/StreakBadge";
import DailyProgressBar from "./DailyProgressBar";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import ErrorState from "@/components/ui/ErrorState";

interface ProgressCardProps {
  childId: string;
  days?: number;
}

export default function ProgressCard({ childId, days = 7 }: ProgressCardProps) {
  const { data, isLoading, error, refetch } = useProgress(childId, days);

  if (isLoading) return <LoadingSkeleton count={1} type="progress" />;
  if (error || !data)
    return <ErrorState message="Could not load progress." onRetry={refetch} />;

  const nowIST = toZonedTime(new Date(), "Asia/Kolkata");
  const last7 = [...Array(7)].map((_, i) => {
    const day = startOfDay(subDays(nowIST, 6 - i));
    const dayStr = format(day, "yyyy-MM-dd");
    const rec = data.progress.find((p) => {
      const d = toZonedTime(new Date(p.date), "Asia/Kolkata");
      return format(startOfDay(d), "yyyy-MM-dd") === dayStr;
    });
    return {
      day,
      label: format(day, "EEEEE"),
      completed: rec?.completed ?? false,
    };
  });

  const todayProgress = data.progress.find((p) => {
    const d = toZonedTime(new Date(p.date), "Asia/Kolkata");
    return (
      format(startOfDay(d), "yyyy-MM-dd") ===
      format(startOfDay(nowIST), "yyyy-MM-dd")
    );
  });

  const completionPct = Math.round(data.completionRate * 100);

  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm space-y-5">
      {/* Top row */}
      <div className="flex items-center justify-between">
        <StreakBadge streak={data.streak} size="lg" />
        <span className="text-sm font-medium text-gray-600">
          {completionPct}% this week
        </span>
      </div>

      {/* 7-day calendar */}
      <div className="flex gap-2">
        {last7.map(({ day, label, completed }) => (
          <div
            key={day.toISOString()}
            className="flex flex-col items-center gap-1"
          >
            <span className="text-[11px] text-gray-500">{label}</span>
            <div
              aria-label={`${format(day, "EEEE")}: ${completed ? "completed" : "not completed"}`}
              className={`w-8 h-8 rounded-full ${
                completed ? "bg-[#16A34A]" : "border border-gray-300"
              }`}
            />
          </div>
        ))}
      </div>

      {/* Today's progress bar */}
      <DailyProgressBar
        wordsViewed={todayProgress?.wordsViewed ?? 0}
        targetWords={data.todayTargetWords}
        completed={todayProgress?.completed ?? false}
      />

      {/* Footer */}
      <p className="text-[13px] text-[#6B7280]">
        🧠 {data.totalWordsLearned} words learned total
      </p>
    </div>
  );
}
