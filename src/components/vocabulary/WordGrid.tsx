"use client";

import { useEffect, useRef } from "react";
import type { StoryWord, ScannedWord } from "@/types";
import WordCard from "./WordCard";

interface WordGridProps {
  words: StoryWord[] | ScannedWord[];
  highlightedWord?: string | null;
  onWordClick: (word: StoryWord | ScannedWord) => void;
}

export default function WordGrid({
  words,
  highlightedWord,
  onWordClick,
}: WordGridProps) {
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (highlightedWord) {
      const lower = highlightedWord.toLowerCase();
      const ref = cardRefs.current[lower];
      ref?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightedWord]);

  return (
    <div
      role="list"
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
    >
      {words.map((w) => (
        <div
          key={w.word}
          ref={(el) => {
            cardRefs.current[w.word.toLowerCase()] = el;
          }}
        >
          <WordCard
            word={w.word}
            partOfSpeech={w.partOfSpeech}
            definition={w.definition}
            exampleSentence={w.exampleSentence}
            highlighted={
              !!(
                highlightedWord &&
                w.word.toLowerCase() === highlightedWord.toLowerCase()
              )
            }
            onClick={() => onWordClick(w)}
          />
        </div>
      ))}
    </div>
  );
}
