import type { AgeGroupKey } from "@/constants/ageGroups";

const EMOJI_MAP: Record<AgeGroupKey, string> = {
  SEEDLING: "🌱",
  SPROUT: "🌿",
  SAPLING: "🌳",
  TREE: "🌲",
};

interface StoryTitleProps {
  title: string;
  ageGroup: AgeGroupKey;
}

export default function StoryTitle({ title, ageGroup }: StoryTitleProps) {
  return (
    <h1 className="font-semibold text-[28px] md:text-[36px] text-gray-900 leading-tight tracking-tight">
      <span aria-hidden className="mr-2">
        {EMOJI_MAP[ageGroup]}
      </span>
      {title}
    </h1>
  );
}
