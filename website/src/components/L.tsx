import type { Lang, Localized } from "@/lib/content";

const LANGS: Lang[] = ["en", "hi", "hinglish"];

/** Renders text in every language; CSS on <html data-lang> shows the chosen one. */
export function L({ v }: { v: Localized }) {
  if (LANGS.every((l) => (v[l] ?? v.en) === v.en)) return <>{v.en}</>;
  return (
    <>
      {LANGS.map((l) => (
        <span key={l} className={`l-${l}`} lang={l === "hi" ? "hi" : undefined}>
          {v[l] ?? v.en}
        </span>
      ))}
    </>
  );
}
