"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import AgeGroupSelector from "@/components/ui/AgeGroupSelector";
import DailyStory from "@/components/story/DailyStory";
import WordGrid from "@/components/vocabulary/WordGrid";
import { useChildStore } from "@/store/childStore";
import type { AgeGroupKey } from "@/constants/ageGroups";
import type { StoryWord, WordDetail } from "@/types";
import WordDrawer from "@/components/story/WordDrawer";

export default function StoryPage() {
  const { activeAgeGroup, activeChildId, setAgeGroup } = useChildStore();
  const [storyWords, setStoryWords] = useState<StoryWord[]>([]);
  const [selectedWord, setSelectedWord] = useState<WordDetail | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleAgeGroupChange = (g: AgeGroupKey) => {
    setAgeGroup(g);
    setStoryWords([]);
  };

  return (
    <AppShell activeTab="story">
      <div className="max-w-[680px] mx-auto space-y-6 py-2">
        <AgeGroupSelector
          selectedGroup={activeAgeGroup}
          onChange={handleAgeGroupChange}
        />
        <DailyStory
          ageGroup={activeAgeGroup}
          childId={activeChildId ?? undefined}
          onStoryLoaded={setStoryWords}
        />
        {storyWords.length > 0 && (
          <WordGrid
            words={storyWords}
            onWordClick={(w) => {
              setSelectedWord(w as WordDetail);
              setDrawerOpen(true);
            }}
          />
        )}
        <WordDrawer
          word={selectedWord}
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        />
      </div>
    </AppShell>
  );
}
