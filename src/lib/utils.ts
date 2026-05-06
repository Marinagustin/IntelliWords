import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns-tz";
import { AGE_GROUPS, type AgeGroupKey } from "@/constants/ageGroups";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function todayIST(): string {
  return format(new Date(), "yyyy-MM-dd", { timeZone: "Asia/Kolkata" });
}

export function getWordTarget(ageGroup: AgeGroupKey): number {
  return AGE_GROUPS[ageGroup].wordsPerDay;
}

export function formatStreak(n: number): string {
  if (n === 0) return "Start your streak today!";
  return `${n} day streak`;
}

export type StorySegment = { type: "text" | "vocab"; content: string };

export function parseStoryBody(body: string): StorySegment[] {
  const parts = body.split(/(<v>[^<]*<\/v>)/g);
  return parts
    .filter((p) => p.length > 0)
    .map((part) => {
      const match = part.match(/^<v>([^<]*)<\/v>$/);
      if (match) {
        return { type: "vocab" as const, content: match[1] };
      }
      return { type: "text" as const, content: part };
    });
}
