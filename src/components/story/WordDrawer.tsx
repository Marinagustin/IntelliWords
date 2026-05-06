"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import type { WordDetail } from "@/types";

interface WordDrawerProps {
  word: WordDetail | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function WordDrawer({ word, isOpen, onClose }: WordDrawerProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) closeRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={onClose}
          aria-hidden
        />
      )}

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Word definition"
        className="fixed bottom-0 left-0 right-0 z-50 max-h-[60vh] overflow-y-auto bg-white rounded-tl-2xl rounded-tr-2xl shadow-2xl transition-transform duration-[250ms] ease-out"
        style={{ transform: isOpen ? "translateY(0)" : "translateY(100%)" }}
      >
        <div className="p-6 relative">
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors"
          >
            <X size={22} />
          </button>

          {word && (
            <>
              <p className="text-[28px] font-bold text-gray-900 pr-8">
                {word.word}
              </p>
              <p className="text-sm italic text-gray-500 mb-4">
                {word.partOfSpeech}
              </p>
              <hr className="border-gray-100 mb-4" />
              <p className="text-base text-gray-700 mb-3">{word.definition}</p>
              <p className="text-sm italic text-gray-500">
                &ldquo;{word.exampleSentence}&rdquo;
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}
