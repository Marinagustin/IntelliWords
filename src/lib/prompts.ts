import { format } from "date-fns-tz";
import { AGE_GROUPS, AgeGroupKey } from "@/constants/ageGroups";

export function buildStoryPrompt(ageGroup: AgeGroupKey): {
  system: string;
  user: string;
} {
  const g = AGE_GROUPS[ageGroup];
  const todayDate = format(new Date(), "dd MMMM yyyy", {
    timeZone: "Asia/Kolkata",
  });

  const system = `You are a master storyteller for children in India. You write warm, imaginative, culturally rich stories that help Indian children aged ${g.ageMin} to ${g.ageMax} years old learn advanced English vocabulary naturally through context.

Your stories feature Indian names, places, foods, festivals, and everyday situations that Indian children recognise. Every story teaches new words not by defining them but by using them in a context so vivid the child almost understands the meaning before they even tap the word.

You always respond in the exact JSON format requested. Never add preamble, explanation, or markdown formatting outside the JSON.`;

  const user = `Today is ${todayDate}.

Write a brand new children's story for Indian kids aged ${g.ageMin} to ${g.ageMax} years old.

Requirements:
- Story length: between ${g.storyMinWords} and ${g.storyMaxWords} words
- Include exactly ${g.wordsPerDay} vocabulary words that are slightly advanced for this age group
- Each vocabulary word must appear naturally in the story — never forced
- Wrap every vocabulary word in <v> tags: <v>magnificent</v>
- The story must have a positive, warm, or moral ending
- Indian cultural elements: use Indian names, settings, or references where natural (do not force it into every sentence)
- Never repeat a vocabulary word — each of the ${g.wordsPerDay} words must be unique

Respond ONLY in this exact JSON format with no text outside it:
{
  "title": "The story title here",
  "body": "Full story text with <v>vocabulary</v> words tagged",
  "words": [
    {
      "word": "the exact word as it appears in the story",
      "partOfSpeech": "noun | verb | adjective | adverb",
      "definition": "simple definition a ${g.ageMin}-year-old can understand",
      "exampleSentence": "a new example sentence different from the story, relatable for an Indian child",
      "displayOrder": 1
    }
  ]
}`;

  return { system, user };
}

export function buildScanPrompt(
  ageGroup: AgeGroupKey,
  pastedText: string,
): { system: string; user: string } {
  const g = AGE_GROUPS[ageGroup];

  const system = `You are an English vocabulary coach for Indian children. You read text from children's books and identify words that are challenging for a specific age group.

You explain words in the simplest possible language — the way a kind, patient teacher would explain to a child who has never heard the word before. Your example sentences always feature Indian children, Indian names, and everyday Indian situations.

You always respond in the exact JSON format requested. Never add preamble, explanation, or markdown outside the JSON.`;

  const user = `Read this text carefully:

"${pastedText}"

Find the ${g.wordsPerDay} most difficult words in this text for a child aged ${g.ageMin} to ${g.ageMax} years old.

Rules:
- Only use words that actually appear in the text above — do not invent or substitute words
- Do not include proper nouns (names of people or places)
- Pick the words a child this age is MOST likely not to know
- If there are fewer than ${g.wordsPerDay} difficult words in the text, return only the ones that qualify — do not pad the list
- Do not include the same word twice
- Sort by difficulty: hardest word first (displayOrder: 1)

Respond ONLY in this exact JSON format with no text outside it:
{
  "words": [
    {
      "word": "exact word from the text",
      "partOfSpeech": "noun | verb | adjective | adverb",
      "definition": "simple meaning a ${g.ageMin}-year-old understands",
      "exampleSentence": "new sentence with Indian context, easy for this age group",
      "displayOrder": 1
    }
  ]
}`;

  return { system, user };
}
