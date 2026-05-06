"use client";

import Link from "next/link";
import { BookOpen, Camera } from "lucide-react";
import AgeGroupBadge from "@/components/ui/AgeGroupBadge";
import StreakBadge from "@/components/ui/StreakBadge";
import { useChildStore } from "@/store/childStore";

interface AppShellProps {
  children: React.ReactNode;
  activeTab: "story" | "scan";
}

export default function AppShell({ children, activeTab }: AppShellProps) {
  const { activeAgeGroup } = useChildStore();

  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAFA]">
      {/* Top nav */}
      <header className="fixed top-0 inset-x-0 z-30 bg-white border-b border-[#E5E7EB] h-14 flex items-center justify-between px-4">
        <Link
          href="/"
          aria-label="IntelliWords home"
          className="font-bold text-lg text-[#6C63FF]"
        >
          IntelliWords
        </Link>
        <div className="flex items-center gap-2">
          <AgeGroupBadge ageGroup={activeAgeGroup} />
          <StreakBadge streak={0} size="sm" />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto mt-14 mb-16 px-4 py-4">
        {children}
      </main>

      {/* Bottom nav */}
      <nav
        aria-label="Main navigation"
        className="fixed bottom-0 inset-x-0 z-30 bg-white border-t border-[#E5E7EB] h-16"
      >
        <div role="tablist" className="flex h-full">
          {[
            {
              tab: "story" as const,
              label: "Story",
              href: "/story",
              Icon: BookOpen,
            },
            {
              tab: "scan" as const,
              label: "Scan",
              href: "/scan",
              Icon: Camera,
            },
          ].map(({ tab, label, href, Icon }) => {
            const active = activeTab === tab;
            return (
              <Link
                key={tab}
                href={href}
                role="tab"
                aria-selected={active}
                className={`flex-1 flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors ${
                  active ? "text-[#6C63FF]" : "text-[#6B7280]"
                }`}
              >
                <Icon size={22} strokeWidth={active ? 2.5 : 1.5} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
