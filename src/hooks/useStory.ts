import { useEffect, useState } from "react";
import axios from "axios";
import type { AgeGroupKey } from "@/constants/ageGroups";
import type { Story } from "@/types";

export function useStory(ageGroup: AgeGroupKey, storyId?: string) {
  const [story, setStory] = useState<Story | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const url = storyId
        ? `/api/story/${storyId}`
        : `/api/story/today?ageGroup=${ageGroup}`;
      const res = await axios.get<{ data: Story }>(url);
      setStory(res.data.data);
    } catch {
      setError("Failed to load story");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ageGroup, storyId]);

  return { story, isLoading, error, refetch: fetchStory };
}
