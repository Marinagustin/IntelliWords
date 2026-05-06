"use client";

import { useState } from "react";
import type { ScannedWord, WordDetail } from "@/types";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import EmptyState from "@/components/ui/EmptyState";
import WordGrid from "@/components/vocabulary/WordGrid";
import WordDrawer from "@/components/story/WordDrawer";

interface ScanResultsProps {
  words: ScannedWord[];
  isLoading: boolean;
}

export default function ScanResults({ words, isLoading }: ScanResultsProps) {
  const [selectedWord, setSelectedWord] = useState<WordDetail | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (isLoading) return <LoadingSkeleton count={8} type="word" />;

  if (words.length === 0) {
    return (
      <EmptyState
        emoji="🎉"
        title="Great news!"
        subtitle="No difficult words found for this age group."
      />
    );
  }

  const plural = words.length === 1 ? "" : "s";

  return (
    <div className="space-y-4">
      <p
        role="status"
        aria-live="polite"
        className="font-bold text-gray-900 text-base"
      >
        We found {words.length} word{plural} to learn
      </p>
      <WordGrid
        words={words}
        onWordClick={(w) => {
          setSelectedWord(w);
          setDrawerOpen(true);
        }}
      />
      <WordDrawer
        word={selectedWord}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
