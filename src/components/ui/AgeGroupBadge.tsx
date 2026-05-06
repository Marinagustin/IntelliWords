import type { AgeGroupKey } from "@/constants/ageGroups";

const BADGE_MAP: Record<AgeGroupKey, { label: string; bg: string }> = {
  SEEDLING: { label: "Seedling", bg: "#22C55E" },
  SPROUT: { label: "Sprout", bg: "#3B82F6" },
  SAPLING: { label: "Sapling", bg: "#F59E0B" },
  TREE: { label: "Tree", bg: "#8B5CF6" },
};

interface AgeGroupBadgeProps {
  ageGroup: AgeGroupKey;
}

export default function AgeGroupBadge({ ageGroup }: AgeGroupBadgeProps) {
  const { label, bg } = BADGE_MAP[ageGroup];
  return (
    <span
      aria-label={`Age group: ${label}`}
      className="rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
      style={{ backgroundColor: bg }}
    >
      {label}
    </span>
  );
}
