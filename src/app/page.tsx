import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center min-h-screen gap-6 px-6 text-center">
      <h1 className="text-5xl font-extrabold tracking-tight text-purple-600">
        IntelliWords
      </h1>
      <p className="text-2xl font-semibold text-gray-800">
        Learn English Word by Word
      </p>
      <p className="text-lg text-gray-500 max-w-sm">
        Daily AI stories for Indian kids aged 4–12
      </p>
      <div className="flex flex-col sm:flex-row gap-4 mt-4">
        <Link
          href="/story"
          className="rounded-full bg-purple-600 px-8 py-3 text-white font-semibold hover:bg-purple-700 transition-colors"
        >
          Read Today&apos;s Story
        </Link>
        <Link
          href="/scan"
          className="rounded-full border-2 border-purple-600 px-8 py-3 text-purple-600 font-semibold hover:bg-purple-50 transition-colors"
        >
          Scan a Book Page
        </Link>
      </div>
    </main>
  );
}
