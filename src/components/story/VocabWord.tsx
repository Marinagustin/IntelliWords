"use client";

import axios from "axios";

interface VocabWordProps {
  word: string;
  definition: string;
  partOfSpeech: string;
  exampleSentence: string;
  storyId: string;
  onTap: () => void;
  childId?: string;
}

export default function VocabWord({
  word,
  storyId,
  onTap,
  childId,
}: VocabWordProps) {
  const handleTap = () => {
    onTap();
    // fire and forget
    axios
      .post("/api/events/word-tap", {
        word,
        source: "STORY",
        storyId,
        ...(childId ? { childId } : {}),
      })
      .catch(() => {});
  };

  return (
    <button
      aria-label={`Tap to learn about: ${word}`}
      onClick={handleTap}
      className="inline text-[#6C63FF] underline decoration-dashed underline-offset-2 hover:bg-[#6C63FF] hover:text-white hover:no-underline hover:rounded px-0.5 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C63FF]"
    >
      {word}
    </button>
  );
}
