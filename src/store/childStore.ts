import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AgeGroupKey } from "@/constants/ageGroups";

interface ChildState {
  activeChildId: string | null;
  activeChildName: string | null;
  activeAgeGroup: AgeGroupKey;
  setActiveChild: (id: string, name: string) => void;
  setAgeGroup: (ageGroup: AgeGroupKey) => void;
  clearActiveChild: () => void;
}

export const useChildStore = create<ChildState>()(
  persist(
    (set) => ({
      activeChildId: null,
      activeChildName: null,
      activeAgeGroup: "SEEDLING",
      setActiveChild: (id, name) =>
        set({ activeChildId: id, activeChildName: name }),
      setAgeGroup: (ageGroup) => set({ activeAgeGroup: ageGroup }),
      clearActiveChild: () =>
        set({
          activeChildId: null,
          activeChildName: null,
          activeAgeGroup: "SEEDLING",
        }),
    }),
    { name: "child-store" },
  ),
);
