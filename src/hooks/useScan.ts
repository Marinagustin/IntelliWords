import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import type { AgeGroupKey } from "@/constants/ageGroups";
import type { ScannedWord } from "@/types";

interface ScanParams {
  text: string;
  ageGroup: AgeGroupKey;
  childId?: string;
}

interface ScanResponse {
  sessionId: string | null;
  words: ScannedWord[];
}

const postScan = async (params: ScanParams): Promise<ScanResponse> => {
  const res = await axios.post<{ data: ScanResponse }>("/api/scan", params);
  return res.data.data;
};

export function useScan() {
  const mutation = useMutation({
    mutationFn: postScan,
  });

  return {
    scan: mutation.mutateAsync,
    words: mutation.data?.words ?? [],
    sessionId: mutation.data?.sessionId ?? null,
    isLoading: mutation.isPending,
    error: mutation.error ? "Scan failed. Please try again." : null,
    reset: mutation.reset,
  };
}
