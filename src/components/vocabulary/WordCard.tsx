"use client";

interface WordCardProps {
  word: string;
  partOfSpeech: string;
  definition: string;
  exampleSentence: string;
  highlighted: boolean;
  onClick: () => void;
}

export default function WordCard({
  word,
  partOfSpeech,
  definition,
  exampleSentence,
  highlighted,
  onClick,
}: WordCardProps) {
  return (
    <button
      role="listitem"
      aria-label={`${word}: ${definition}`}
      aria-pressed={highlighted}
      onClick={onClick}
      className="w-full text-left rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm hover:shadow-md active:scale-[0.98] transition-all duration-200"
      style={highlighted ? { boxShadow: "0 0 0 3px #6C63FF" } : undefined}
    >
      <p className="text-base font-bold text-gray-900">{word}</p>
      <p className="text-xs italic text-gray-500 mb-2">{partOfSpeech}</p>
      <hr className="border-gray-100 mb-2" />
      <p className="text-sm text-gray-700">{definition}</p>
      <p className="text-[13px] italic text-[#6B7280] mt-1">
        e.g. {exampleSentence}
      </p>
    </button>
  );
}
