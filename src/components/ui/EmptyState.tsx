interface EmptyStateProps {
  emoji: string;
  title: string;
  subtitle: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({
  emoji,
  title,
  subtitle,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
      <span className="text-5xl" aria-hidden>
        {emoji}
      </span>
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      <p className="text-sm text-gray-500 max-w-xs">{subtitle}</p>
      {action && (
        <button
          onClick={action.onClick}
          aria-label={action.label}
          className="mt-2 rounded-lg bg-[#6C63FF] px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
