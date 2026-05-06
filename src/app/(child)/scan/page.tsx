"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import AgeGroupSelector from "@/components/ui/AgeGroupSelector";
import ScanInput from "@/components/scan/ScanInput";
import ScanResults from "@/components/scan/ScanResults";
import { useChildStore } from "@/store/childStore";
import type { AgeGroupKey } from "@/constants/ageGroups";
import type { ScannedWord } from "@/types";

export default function ScanPage() {
  const { activeAgeGroup, activeChildId, setAgeGroup } = useChildStore();
  const [scanWords, setScanWords] = useState<ScannedWord[]>([]);
  const [scanning, setScanning] = useState(false);

  const handleAgeGroupChange = (g: AgeGroupKey) => {
    setAgeGroup(g);
    setScanWords([]);
  };

  return (
    <AppShell activeTab="scan">
      <div className="max-w-[680px] mx-auto space-y-6 py-2">
        <AgeGroupSelector
          selectedGroup={activeAgeGroup}
          onChange={handleAgeGroupChange}
        />
        <ScanInput
          ageGroup={activeAgeGroup}
          childId={activeChildId ?? undefined}
          onResults={setScanWords}
          onLoadingChange={setScanning}
        />
        <ScanResults words={scanWords} isLoading={scanning} />
      </div>
    </AppShell>
  );
}
