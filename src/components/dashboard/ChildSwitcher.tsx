"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import type { ChildProfile } from "@/types";
import ChildCard from "./ChildCard";
import ChildSetupForm from "./ChildSetupForm";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";

interface ChildSwitcherProps {
  activeChildId: string;
  onSwitch: (childId: string) => void;
  parentId?: string;
}

export default function ChildSwitcher({
  activeChildId,
  onSwitch,
  parentId = "",
}: ChildSwitcherProps) {
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const fetchChildren = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await axios.get<{ data: ChildProfile[] }>(
        `/api/children?parentId=${parentId}`,
      );
      setChildren(res.data.data);
    } catch {
      setError("Could not load children");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChildren();
  }, [parentId]);

  if (isLoading) return <LoadingSkeleton count={3} type="word" />;
  if (error) return <ErrorState message={error} onRetry={fetchChildren} />;

  return (
    <div className="space-y-3">
      {children.length === 0 ? (
        <EmptyState
          emoji="👶"
          title="No children yet"
          subtitle="Add your first child to get started."
          action={{ label: "+ Add Child", onClick: () => setShowForm(true) }}
        />
      ) : (
        <ul className="space-y-2">
          {children.map((child) => (
            <li key={child.id}>
              <ChildCard
                child={child}
                isActive={child.id === activeChildId}
                onClick={() => onSwitch(child.id)}
              />
            </li>
          ))}
        </ul>
      )}

      {children.length > 0 && (
        <button
          onClick={() => setShowForm(true)}
          aria-label="Add a new child profile"
          className="w-full rounded-lg border-2 border-dashed border-gray-300 py-2.5 text-sm text-gray-500 hover:border-[#6C63FF] hover:text-[#6C63FF] transition-colors"
        >
          + Add Child
        </button>
      )}

      {showForm && (
        <ChildSetupForm
          parentId={parentId}
          onSuccess={(child) => {
            setShowForm(false);
            fetchChildren();
            onSwitch(child.id);
          }}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
