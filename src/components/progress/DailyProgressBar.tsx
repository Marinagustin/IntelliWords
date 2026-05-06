interface DailyProgressBarProps {
  wordsViewed: number;
  targetWords: number;
  completed: boolean;
}

export default function DailyProgressBar({
  wordsViewed,
  targetWords,
  completed,
}: DailyProgressBarProps) {
  const pct = Math.min(wordsViewed / Math.max(targetWords, 1), 1) * 100;
  const barColor = completed ? "#16A34A" : "#6C63FF";

  return (
    <div className="w-full space-y-1.5">
      <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden">
        <div
          role="progressbar"
          aria-valuenow={wordsViewed}
          aria-valuemin={0}
          aria-valuemax={targetWords}
          aria-label="Words explored today"
          className="h-full rounded-full transition-all duration-[400ms] ease-out"
          style={{ width: `${pct}%`, backgroundColor: barColor }}
        />
      </div>
      {completed ? (
        <p className="text-[13px] text-[#16A34A] font-medium">
          ✅ Today&apos;s story complete!
        </p>
      ) : (
        <p className="text-[13px] text-[#6B7280]">
          {wordsViewed} of {targetWords} words explored today
        </p>
      )}
    </div>
  );
}
