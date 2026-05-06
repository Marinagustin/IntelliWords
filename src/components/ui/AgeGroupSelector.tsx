"use client";

import { useEffect, useRef } from "react";
import { AGE_GROUPS, type AgeGroupKey } from "@/constants/ageGroups";

interface AgeGroupSelectorProps {
  selectedGroup: AgeGroupKey;
  onChange: (group: AgeGroupKey) => void;
}

const ORDER: AgeGroupKey[] = ["SEEDLING", "SPROUT", "SAPLING", "TREE"];

export default function AgeGroupSelector({
  selectedGroup,
  onChange,
}: AgeGroupSelectorProps) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    refs.current[selectedGroup]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [selectedGroup]);

  return (
    <div
      role="radiogroup"
      aria-label="Select age group"
      className="flex gap-3 overflow-x-auto scrollbar-hide pb-1"
    >
      {ORDER.map((key) => {
        const g = AGE_GROUPS[key];
        const selected = key === selectedGroup;
        return (
          <button
            key={key}
            role="radio"
            aria-checked={selected}
            ref={(el) => {
              refs.current[key] = el;
            }}
            onClick={() => onChange(key)}
            className="flex-shrink-0 flex flex-col items-center px-4 py-2 rounded-full border transition-colors text-sm font-medium min-w-[110px]"
            style={
              selected
                ? {
                    backgroundColor: g.colour,
                    color: "#fff",
                    borderColor: g.colour,
                  }
                : {
                    backgroundColor: "#fff",
                    color: "#374151",
                    borderColor: "#E5E7EB",
                  }
            }
          >
            <span>
              {g.emoji} {g.label}
            </span>
            <span className="text-xs opacity-75">
              {g.wordsPerDay} words/day
            </span>
          </button>
        );
      })}
    </div>
  );
}
