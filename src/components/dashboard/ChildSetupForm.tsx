"use client";

import { useState } from "react";
import axios from "axios";
import type { ChildProfile } from "@/types";
import type { AgeGroupKey } from "@/constants/ageGroups";
import AgeGroupSelector from "@/components/ui/AgeGroupSelector";
import LoadingDots from "@/components/ui/LoadingDots";

const AVATAR_OPTIONS = [
  "🌟",
  "🐯",
  "🦁",
  "🐬",
  "🦋",
  "🌈",
  "🚀",
  "🎨",
  "🎵",
  "🏆",
  "🌸",
  "🦊",
];

interface ChildSetupFormProps {
  parentId: string;
  onSuccess: (child: ChildProfile) => void;
  onCancel: () => void;
}

export default function ChildSetupForm({
  parentId,
  onSuccess,
  onCancel,
}: ChildSetupFormProps) {
  const [name, setName] = useState("");
  const [ageGroup, setAgeGroup] = useState<AgeGroupKey | null>(null);
  const [avatar, setAvatar] = useState("🌟");
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState("");
  const [formError, setFormError] = useState("");

  const validate = () => {
    if (!name || name.trim().length < 2) {
      setNameError("Name must be at least 2 characters");
      return false;
    }
    if (!ageGroup) {
      setFormError("Please select an age group");
      return false;
    }
    setNameError("");
    setFormError("");
    return true;
  };

  const handleSubmit = async () => {
    if (!validate() || !ageGroup) return;
    setLoading(true);
    try {
      const res = await axios.post<{ data: ChildProfile }>("/api/children", {
        name: name.trim(),
        ageGroup,
        avatarEmoji: avatar,
        parentId,
      });
      onSuccess(res.data.data);
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-label="Add a new child profile"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-xl shadow-2xl p-6 w-full max-w-md space-y-5">
        <h2 className="text-xl font-bold text-gray-900">Add a new child</h2>

        {/* Name */}
        <div>
          <label
            htmlFor="child-name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Name
          </label>
          <input
            id="child-name"
            type="text"
            maxLength={30}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => {
              if (name.trim().length < 2)
                setNameError("Name must be at least 2 characters");
              else setNameError("");
            }}
            disabled={loading}
            className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6C63FF]"
          />
          {nameError && (
            <p className="text-xs text-red-600 mt-1">{nameError}</p>
          )}
        </div>

        {/* Age group */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Age Group</p>
          <AgeGroupSelector
            selectedGroup={ageGroup ?? "SEEDLING"}
            onChange={(g) => setAgeGroup(g)}
          />
        </div>

        {/* Avatar */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Avatar</p>
          <div
            role="radiogroup"
            aria-label="Choose an avatar"
            className="grid grid-cols-6 gap-2"
          >
            {AVATAR_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                role="radio"
                aria-checked={avatar === emoji}
                onClick={() => setAvatar(emoji)}
                className={`text-2xl rounded-lg p-1.5 border-2 transition-colors ${
                  avatar === emoji
                    ? "border-[#6C63FF] bg-purple-50"
                    : "border-transparent hover:border-gray-200"
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {formError && <p className="text-sm text-red-600">{formError}</p>}

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            aria-busy={loading}
            className="rounded-lg bg-[#6C63FF] px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <LoadingDots label="Saving…" size="sm" /> : "Add Child"}
          </button>
        </div>
      </div>
    </div>
  );
}
