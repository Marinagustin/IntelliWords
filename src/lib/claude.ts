import Groq from "groq-sdk";
import { AgeGroupKey, AGE_GROUPS } from "@/constants/ageGroups";
import { buildStoryPrompt, buildScanPrompt } from "./prompts";
import { ScannedWord } from "@/types";

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const MODEL = "llama-3.3-70b-versatile";

function validateStoryResponse(
  data: unknown,
  expectedWordCount: number,
): { valid: boolean; error?: string } {
  const d = data as Record<string, unknown>;
  if (!d.title || typeof d.title !== "string")
    return { valid: false, error: "Missing title" };
  if (!d.body || typeof d.body !== "string")
    return { valid: false, error: "Missing body" };
  if (!Array.isArray(d.words))
    return { valid: false, error: "Missing words array" };

  // Require at least one <v> tag per vocabulary word; extras are fine (they
  // just highlight additional occurrences of the word in the story body).
  const vTagMatches = (d.body as string).match(/<v>(.*?)<\/v>/g) || [];
  if (vTagMatches.length < expectedWordCount)
    return {
      valid: false,
      error: `Expected at least ${expectedWordCount} <v> tags, found ${vTagMatches.length}`,
    };
  if (d.words.length !== expectedWordCount)
    return {
      valid: false,
      error: `Expected ${expectedWordCount} words, got ${d.words.length}`,
    };

  const wordList = d.words.map((w: unknown) =>
    (w as Record<string, string>).word.toLowerCase(),
  );
  const unique = new Set(wordList);
  if (unique.size !== wordList.length)
    return { valid: false, error: "Duplicate words found" };

  return { valid: true };
}

function validateScanResponse(
  data: unknown,
  pastedText: string,
  maxWords: number,
): { valid: boolean; error?: string } {
  const d = data as Record<string, unknown>;
  if (!Array.isArray(d.words))
    return { valid: false, error: "Missing words array" };
  if (d.words.length > maxWords)
    return { valid: false, error: `Too many words: ${d.words.length}` };

  for (const w of d.words) {
    const word = (w as Record<string, string>).word;
    if (!pastedText.toLowerCase().includes(word.toLowerCase()))
      return { valid: false, error: `Word "${word}" not found in text` };
  }

  return { valid: true };
}

export async function generateStory(ageGroup: AgeGroupKey) {
  const { system, user } = buildStoryPrompt(ageGroup);
  const expectedWordCount = AGE_GROUPS[ageGroup].wordsPerDay;
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const retryNote =
      attempt > 1
        ? "\n\nYour previous response failed validation. Please try again carefully and return valid JSON only."
        : "";

    const response = await client.chat.completions.create({
      model: MODEL,
      temperature: 0.8,
      max_tokens: 2000,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user + retryNote },
      ],
    });

    const raw = response.choices[0]?.message?.content || "";

    try {
      const clean = raw.replace(/```json|```/g, "").trim();
      const data = JSON.parse(clean);
      const validation = validateStoryResponse(data, expectedWordCount);

      if (!validation.valid) {
        console.error(
          `Story validation failed (attempt ${attempt}):`,
          validation.error,
        );
        if (attempt === maxRetries)
          throw new Error(`Story generation failed: ${validation.error}`);
        continue;
      }

      return data;
    } catch (e) {
      if (attempt === maxRetries) throw e;
    }
  }
}

export async function extractDifficultWords(
  ageGroup: AgeGroupKey,
  pastedText: string,
) {
  const { system, user } = buildScanPrompt(ageGroup, pastedText);
  const maxWords = AGE_GROUPS[ageGroup].wordsPerDay;

  const response = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.3,
    max_tokens: 1000,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  const raw = response.choices[0]?.message?.content || "";

  try {
    const clean = raw.replace(/```json|```/g, "").trim();
    const data = JSON.parse(clean) as { words?: ScannedWord[] };
    const validation = validateScanResponse(data, pastedText, maxWords);

    if (!validation.valid) {
      console.error("Scan validation failed:", validation.error);
      return data.words || [];
    }

    return data.words as ScannedWord[];
  } catch (e) {
    console.error("Failed to parse scan response:", e);
    return [];
  }
}
