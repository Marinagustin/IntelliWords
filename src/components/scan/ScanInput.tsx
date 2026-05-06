"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import type { AgeGroupKey } from "@/constants/ageGroups";
import type { ScannedWord } from "@/types";
import LoadingDots from "@/components/ui/LoadingDots";

interface ScanInputProps {
  ageGroup: AgeGroupKey;
  childId?: string;
  onResults: (words: ScannedWord[]) => void;
  onLoadingChange?: (loading: boolean) => void;
}

export default function ScanInput({
  ageGroup,
  childId,
  onResults,
  onLoadingChange,
}: ScanInputProps) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const count = text.length;
  const counterId = "scan-char-count";

  const handleSubmit = async () => {
    setLoading(true);
    onLoadingChange?.(true);
    try {
      const res = await axios.post<{
        data: { sessionId: string | null; words: ScannedWord[] };
      }>("/api/scan", { text, ageGroup, ...(childId ? { childId } : {}) });
      onResults(res.data.data.words);
      setText("");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
      onLoadingChange?.(false);
    }
  };

  return (
    <div className="space-y-3">
      <textarea
        aria-label="Book text to scan"
        aria-describedby={counterId}
        value={text}
        onChange={(e) => setText(e.target.value)}
        readOnly={loading}
        maxLength={2000}
        rows={6}
        placeholder="Paste a paragraph from any book here…"
        className="w-full rounded-lg border border-[#E5E7EB] p-3 text-base text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-[#6C63FF] disabled:opacity-50"
      />
      <div className="flex items-center justify-between">
        <p
          id={counterId}
          role="status"
          aria-live="polite"
          className={`text-[13px] ${count >= 1800 ? "text-[#DC2626]" : "text-[#6B7280]"}`}
        >
          {count} / 2000
        </p>
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || loading}
          aria-busy={loading}
          className="rounded-lg bg-[#6C63FF] px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center gap-2"
        >
          {loading ? (
            <LoadingDots label="Finding words…" size="sm" />
          ) : (
            "Find Difficult Words"
          )}
        </button>
      </div>
    </div>
  );
}
