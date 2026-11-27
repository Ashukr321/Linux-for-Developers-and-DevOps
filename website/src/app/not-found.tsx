import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="max-w-md text-center">
        <p className="font-mono text-sm text-accent">$ cd page/ — 404</p>
        <h1 className="mt-3 text-3xl font-bold">Page not found</h1>
        <p className="mt-2 text-fg-muted">bash: no such file or directory. The topic may have moved.</p>
        <Link href="/" className="mt-6 inline-flex rounded-md bg-accent px-4 py-2 font-medium text-white hover:opacity-90">
          Back to all topics
        </Link>
      </div>
    </main>
  );
}
