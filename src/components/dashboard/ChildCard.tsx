import type { ChildProfile } from "@/types";
import AgeGroupBadge from "@/components/ui/AgeGroupBadge";
import StreakBadge from "@/components/ui/StreakBadge";
import type { AgeGroupKey } from "@/constants/ageGroups";

interface ChildCardProps {
  child: ChildProfile;
  isActive: boolean;
  onClick: () => void;
}

export default function ChildCard({
  child,
  isActive,
  onClick,
}: ChildCardProps) {
  return (
    <button
      aria-pressed={isActive}
      aria-label={`${child.name}'s profile`}
      onClick={onClick}
      className={`w-full text-left flex items-center gap-3 rounded-xl border p-3 shadow-sm hover:shadow-md transition-all ${
        isActive ? "border-[#6C63FF] bg-[#F5F3FF]" : "border-[#E5E7EB] bg-white"
      }`}
    >
      <span className="text-3xl leading-none">{child.avatarEmoji}</span>
      <div className="flex flex-col gap-1 min-w-0">
        <span className="font-bold text-sm text-gray-900 truncate">
          {child.name}
        </span>
        <div className="flex items-center gap-1.5 flex-wrap">
          <AgeGroupBadge ageGroup={child.ageGroup as AgeGroupKey} />
          <StreakBadge streak={child.streak} size="sm" />
        </div>
      </div>
    </button>
  );
}
