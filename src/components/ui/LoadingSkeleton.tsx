interface LoadingSkeletonProps {
  count: number;
  type: "word" | "story" | "progress";
}

const shimmer =
  "animate-pulse bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded";

function WordSkeleton() {
  return (
    <div
      className="rounded-xl border border-gray-200 p-4 space-y-2"
      aria-hidden
    >
      <div className={`${shimmer} h-4 w-2/3`} />
      <div className={`${shimmer} h-3 w-1/3`} />
      <hr className="border-gray-100" />
      <div className={`${shimmer} h-3 w-full`} />
      <div className={`${shimmer} h-3 w-3/4`} />
    </div>
  );
}

function StorySkeleton() {
  return (
    <div
      className="rounded-xl border border-gray-200 p-6 space-y-4"
      aria-hidden
    >
      <div className={`${shimmer} h-8 w-3/4`} />
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className={`${shimmer} h-4 ${i % 3 === 2 ? "w-2/3" : "w-full"}`}
        />
      ))}
    </div>
  );
}

function ProgressSkeleton() {
  return (
    <div
      className="rounded-xl border border-gray-200 p-6 space-y-4"
      aria-hidden
    >
      <div className="flex justify-between">
        <div className={`${shimmer} h-6 w-1/3`} />
        <div className={`${shimmer} h-6 w-1/4`} />
      </div>
      <div className="flex gap-2">
        {[...Array(7)].map((_, i) => (
          <div key={i} className={`${shimmer} h-8 w-8 rounded-full`} />
        ))}
      </div>
      <div className={`${shimmer} h-4 w-full rounded-full`} />
      <div className={`${shimmer} h-4 w-1/2`} />
    </div>
  );
}

export default function LoadingSkeleton({ count, type }: LoadingSkeletonProps) {
  return (
    <div role="status" aria-label="Loading content">
      {type === "word" &&
        [...Array(count)].map((_, i) => <WordSkeleton key={i} />)}
      {type === "story" && <StorySkeleton />}
      {type === "progress" && <ProgressSkeleton />}
    </div>
  );
}
