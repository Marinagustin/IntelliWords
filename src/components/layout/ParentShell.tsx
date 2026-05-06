"use client";

import { useState } from "react";
import { Menu, X, LogOut } from "lucide-react";
import ChildSwitcher from "@/components/dashboard/ChildSwitcher";

interface ParentShellProps {
  children: React.ReactNode;
  activeChildId: string;
  onSwitch: (id: string) => void;
  parentId?: string;
}

export default function ParentShell({
  children,
  activeChildId,
  onSwitch,
  parentId,
}: ParentShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const sidebar = (
    <div className="w-60 flex-shrink-0 p-4 border-r border-[#E5E7EB] bg-white overflow-y-auto">
      <ChildSwitcher
        activeChildId={activeChildId}
        onSwitch={onSwitch}
        parentId={parentId}
      />
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAFA]">
      {/* Top bar */}
      <header className="fixed top-0 inset-x-0 z-30 bg-white border-b border-[#E5E7EB] h-14 flex items-center justify-between px-4">
        <button
          className="md:hidden text-gray-500"
          aria-label={sidebarOpen ? "Close navigation" : "Open navigation"}
          onClick={() => setSidebarOpen((v) => !v)}
        >
          {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <span className="font-bold text-lg text-[#6C63FF]">IntelliWords</span>
        <button
          aria-label="Log out"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800"
        >
          <LogOut size={16} /> Log out
        </button>
      </header>

      <div className="flex flex-1 mt-14">
        {/* Desktop sidebar */}
        <div className="hidden md:flex">{sidebar}</div>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <div className="absolute inset-0 bg-black/40" />
            <div
              role="dialog"
              aria-modal="true"
              className="relative w-60 h-full bg-white"
              onClick={(e) => e.stopPropagation()}
            >
              {sidebar}
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
