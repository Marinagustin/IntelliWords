"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import type { AgeGroupKey } from "@/constants/ageGroups";
import type { StoryWord, WordDetail } from "@/types";
import { useStory } from "@/hooks/useStory";
import StoryTitle from "./StoryTitle";
import StoryBody from "./StoryBody";
import WordDrawer from "./WordDrawer";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import ErrorState from "@/components/ui/ErrorState";
import DailyProgressBar from "@/components/progress/DailyProgressBar";

interface DailyStoryProps {
  ageGroup: AgeGroupKey;
  storyId?: string;
  childId?: string;
  onStoryLoaded?: (words: StoryWord[]) => void;
}

export default function DailyStory({
  ageGroup,
  storyId,
  childId,
  onStoryLoaded,
}: DailyStoryProps) {
  const { story, isLoading, error, refetch } = useStory(ageGroup, storyId);
  const [selectedWord, setSelectedWord] = useState<WordDetail | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [wordsViewed, setWordsViewed] = useState<Set<string>>(new Set());
  const timeRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (story?.words) {
      onStoryLoaded?.(story.words);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story?.id]);

  useEffect(() => {
    timeRef.current = 0;
    setWordsViewed(new Set());
    intervalRef.current = setInterval(() => {
      timeRef.current += 1;
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (story && childId) {
        axios
          .post("/api/progress", {
            childId,
            storyId: story.id,
            wordsViewed: wordsViewed.size,
            timeSpentSeconds: timeRef.current,
          })
          .catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ageGroup, storyId]);

  const handleWordTap = (word: StoryWord) => {
    setWordsViewed((prev) => new Set(prev).add(word.word));
    setSelectedWord(word);
    setDrawerOpen(true);
  };

  if (isLoading) {
    return (
      <div aria-live="polite" aria-label="Loading today's story…">
        <LoadingSkeleton count={1} type="story" />
      </div>
    );
  }

  if (error || !story) {
    return (
      <ErrorState message="Could not load today's story." onRetry={refetch} />
    );
  }

  const targetWords = story.words.length;

  return (
    <article aria-label="Today's story" className="space-y-6">
      <StoryTitle title={story.title} ageGroup={ageGroup} />
      <DailyProgressBar
        wordsViewed={wordsViewed.size}
        targetWords={targetWords}
        completed={wordsViewed.size >= targetWords}
      />
      <StoryBody
        body={story.body}
        words={story.words}
        onWordTap={handleWordTap}
        storyId={story.id}
        childId={childId}
      />
      <WordDrawer
        word={selectedWord}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </article>
  );
}
