import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { ProgressSummary } from "@/types";

const fetchProgress = async (
  childId: string,
  days: number,
): Promise<ProgressSummary> => {
  const res = await axios.get<{ data: ProgressSummary }>(
    `/api/children/${childId}/progress?days=${days}`,
  );
  return res.data.data;
};

export function useProgress(childId: string, days = 7) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["progress", childId, days],
    queryFn: () => fetchProgress(childId, days),
    enabled: !!childId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    data: data ?? null,
    isLoading,
    error: error ? "Failed to load progress" : null,
    refetch,
  };
}
