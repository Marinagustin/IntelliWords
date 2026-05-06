interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-red-200 bg-[#FEF2F2] p-6 flex flex-col items-center gap-4 text-center"
    >
      <span className="text-3xl" aria-hidden>
        ⚠️
      </span>
      <p className="text-gray-700 text-sm">{message}</p>
      <button
        onClick={onRetry}
        aria-label="Retry loading"
        className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
