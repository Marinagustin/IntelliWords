import type { StoryWord } from "@/types";
import VocabWord from "./VocabWord";

interface StoryBodyProps {
  body: string;
  words: StoryWord[];
  onWordTap: (word: StoryWord) => void;
  storyId: string;
  childId?: string;
}

export default function StoryBody({
  body,
  words,
  onWordTap,
  storyId,
  childId,
}: StoryBodyProps) {
  const wordMap = new Map(words.map((w) => [w.word.toLowerCase(), w]));

  const parts = body.split(/(<v>[^<]*<\/v>)/g);

  return (
    <p
      lang="en"
      className="text-[18px] leading-[1.8] text-gray-800 hyphens-auto"
    >
      {parts.map((part, i) => {
        const match = part.match(/^<v>([^<]*)<\/v>$/);
        if (match) {
          const raw = match[1];
          const storyWord = wordMap.get(raw.toLowerCase());
          if (storyWord) {
            return (
              <VocabWord
                key={i}
                word={storyWord.word}
                definition={storyWord.definition}
                partOfSpeech={storyWord.partOfSpeech}
                exampleSentence={storyWord.exampleSentence}
                storyId={storyId}
                childId={childId}
                onTap={() => onWordTap(storyWord)}
              />
            );
          }
          return <span key={i}>{raw}</span>;
        }
        return <span key={i}>{part}</span>;
      })}
    </p>
  );
}
