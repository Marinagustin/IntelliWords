"use client";

import { useState, useRef } from "react";
import ParentShell from "@/components/layout/ParentShell";
import ProgressCard from "@/components/progress/ProgressCard";

export default function DashboardPage() {
  const [activeChildId, setActiveChildId] = useState("");
  const liveRef = useRef<HTMLSpanElement>(null);

  const handleSwitch = (id: string) => {
    setActiveChildId(id);
  };

  return (
    <ParentShell activeChildId={activeChildId} onSwitch={handleSwitch}>
      <span ref={liveRef} aria-live="polite" className="sr-only" />
      {activeChildId ? (
        <ProgressCard childId={activeChildId} />
      ) : (
        <div className="text-gray-500 text-sm">
          Select a child from the sidebar to see their progress.
        </div>
      )}
    </ParentShell>
  );
}
