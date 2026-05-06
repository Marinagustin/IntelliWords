import { useEffect, useState } from "react";
import axios from "axios";
import type { ProgressSummary } from "@/types";

export function useProgress(childId: string, days = 7) {
  const [data, setData] = useState<ProgressSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await axios.get<{ data: ProgressSummary }>(
        `/api/children/${childId}/progress?days=${days}`,
      );
      setData(res.data.data);
    } catch {
      setError("Failed to load progress");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (childId) fetchProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId, days]);

  return { data, isLoading, error, refetch: fetchProgress };
}
