import type { AgeGroupKey } from "@/constants/ageGroups";

export interface WordDetail {
  word: string;
  partOfSpeech: string;
  definition: string;
  exampleSentence: string;
}

export interface StoryWord extends WordDetail {
  id: string;
  storyId: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ScannedWord extends WordDetail {
  displayOrder: number;
}

export interface Story {
  id: string;
  title: string;
  body: string;
  ageGroup: AgeGroupKey;
  status: string;
  wordCount: number;
  generatedAt: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  words: StoryWord[];
}

export interface ChildProfile {
  id: string;
  name: string;
  ageGroup: AgeGroupKey;
  avatarEmoji: string;
  streak: number;
  longestStreak: number;
  totalWordsLearned: number;
  lastActiveDate: string | null;
  createdAt: string;
}

export interface DailyProgress {
  id: string;
  childId: string;
  storyId: string;
  date: string;
  completed: boolean;
  wordsViewed: number;
  timeSpentSeconds: number;
  story: Story;
}

export interface ProgressSummary {
  progress: DailyProgress[];
  streak: number;
  longestStreak: number;
  totalWordsLearned: number;
  completionRate: number;
  todayTargetWords: number;
}

export interface ScanResult {
  sessionId: string | null;
  words: ScannedWord[];
}
