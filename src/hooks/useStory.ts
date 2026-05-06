import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { AgeGroupKey } from "@/constants/ageGroups";
import type { Story } from "@/types";

const fetchStory = async (
  ageGroup: AgeGroupKey,
  storyId?: string,
): Promise<Story> => {
  const url = storyId
    ? `/api/story/${storyId}`
    : `/api/story/today?ageGroup=${ageGroup}`;
  const res = await axios.get<{ data: Story }>(url);
  return res.data.data;
};

export function useStory(ageGroup: AgeGroupKey, storyId?: string) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["story", ageGroup, storyId ?? "today"],
    queryFn: () => fetchStory(ageGroup, storyId),
    staleTime: 60 * 60 * 1000, // 1 hour — stories change once per day
  });

  return {
    story: data ?? null,
    isLoading,
    error: error ? "Failed to load story" : null,
    refetch,
  };
}
