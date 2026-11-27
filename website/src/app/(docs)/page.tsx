import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { L } from "@/components/L";
import { loadContent, type Doc, type Localized } from "@/lib/content";
import { SITE } from "@/lib/site";

const descriptions = (d: Doc): Localized => ({
  en: d.variants.en.description,
  hi: d.variants.hi?.description,
  hinglish: d.variants.hinglish?.description,
});

export default function Home() {
  const { categories, docs } = loadContent();
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
      <section className="max-w-3xl">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-xs text-fg-muted">
          <BookOpen className="size-3.5 text-accent" />
          {docs.length} topics · {categories.length} categories
        </span>
        <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">{SITE.name}</h1>
        <p className="mt-4 text-lg text-fg-muted">
          <L
            v={{
              en: "Learn Unix and Linux from the ground up and get ready for Linux, shell scripting and DevOps interviews. Every topic is available in English, Hinglish and Hindi.",
              hinglish:
                "Unix aur Linux ko basics se seekhiye aur Linux, shell scripting aur DevOps interviews ki taiyari kijiye. Har topic English, Hinglish aur Hindi mein available hai.",
              hi: "Unix और Linux को शुरुआत से सीखिए और Linux, shell scripting और DevOps इंटरव्यू की तैयारी कीजिए। हर टॉपिक अंग्रेज़ी, Hinglish और हिन्दी में उपलब्ध है।",
            }}
          />
        </p>
        {docs[0] && (
          <Link
            href={docs[0].url}
            className="mt-8 inline-flex items-center gap-2 rounded-md bg-accent px-5 py-2.5 font-medium text-white hover:opacity-90"
          >
            <L v={{ en: "Start reading", hinglish: "Padhna shuru karein", hi: "पढ़ना शुरू करें" }} />
            <ArrowRight className="size-4" />
          </Link>
        )}
      </section>

      <section className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c, i) => {
          const intro = c.docs.find((d) => d.slug === c.slug) ?? c.docs[0];
          return (
            <Link
              key={c.slug}
              href={intro?.url ?? "/"}
              className="group flex flex-col rounded-xl border border-border bg-muted/40 p-5 transition-colors hover:border-accent/60 hover:bg-muted"
            >
              <span className="font-mono text-xs text-accent">{String(i + 1).padStart(2, "0")}</span>
              <h2 className="mt-2 text-lg font-semibold group-hover:text-accent">
                <L v={c.title} />
              </h2>
              {intro && (
                <p className="mt-2 line-clamp-3 text-sm text-fg-muted">
                  <L v={descriptions(intro)} />
                </p>
              )}
              <span className="mt-auto pt-4 text-xs text-fg-muted">{c.docs.length} topics</span>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
