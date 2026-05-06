interface StreakBadgeProps {
  streak: number;
  size: "sm" | "md" | "lg";
}

const SIZE_MAP = { sm: "text-xs", md: "text-sm", lg: "text-base" };

export default function StreakBadge({ streak, size }: StreakBadgeProps) {
  const textClass = SIZE_MAP[size];

  if (streak === 0) {
    return (
      <span aria-label="No streak yet" className={`${textClass} text-gray-500`}>
        Start your streak today!
      </span>
    );
  }

  const isGold = streak >= 30;
  const isPulse = streak >= 7 && !isGold;

  return (
    <span
      aria-label={`${streak} day streak`}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-semibold ${textClass} ${
        isGold
          ? "bg-amber-600 text-white"
          : isPulse
            ? "bg-orange-100 text-orange-600 animate-pulse"
            : "bg-orange-100 text-orange-600"
      }`}
    >
      <span aria-hidden>🔥</span>
      {streak}
    </span>
  );
}
