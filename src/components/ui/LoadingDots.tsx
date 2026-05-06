"use client";

interface LoadingDotsProps {
  label: string;
  size?: "sm" | "md";
}

export default function LoadingDots({ label, size = "md" }: LoadingDotsProps) {
  const dotSize = size === "sm" ? "w-1 h-1" : "w-1.5 h-1.5";
  return (
    <span
      role="status"
      aria-label={label}
      className="inline-flex items-center gap-1"
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          aria-hidden
          className={`${dotSize} rounded-full bg-current inline-block animate-bounce`}
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </span>
  );
}
