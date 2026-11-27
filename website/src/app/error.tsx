"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="max-w-md text-center">
        <p className="font-mono text-sm text-red-500">exit status 1</p>
        <h1 className="mt-3 text-3xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-fg-muted">Try again, or go back to the topic list.</p>
        <div className="mt-6 flex justify-center gap-3">
          <button type="button" onClick={reset} className="rounded-md border border-border px-4 py-2 hover:bg-muted">
            Try again
          </button>
          <Link href="/" className="rounded-md bg-accent px-4 py-2 font-medium text-white hover:opacity-90">
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
