import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { L } from "@/components/L";
import { Markdown } from "@/components/Markdown";
import { LANGS, assetUrl, getDoc, getNeighbours, loadContent } from "@/lib/content";
import { SITE } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return loadContent().docs.map((d) => ({ slug: d.slug.split("/") }));
}

type Props = { params: Promise<{ slug: string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const doc = getDoc((await params).slug.join("/"));
  if (!doc) return {};
  const title = doc.slug === doc.category ? doc.title.en : `${doc.title.en} — ${doc.categoryTitle.en}`;
  return {
    title,
    description: doc.description,
    alternates: { canonical: doc.url },
    openGraph: { type: "article", title, description: doc.description, url: doc.url, siteName: SITE.name },
    twitter: { card: "summary", title, description: doc.description },
  };
}

const caption = (p: string) =>
  p
    .split("/")
    .pop()!
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s*\(\d+\)$/, "")
    .replace(/^./, (c) => c.toUpperCase());

export default async function DocPage({ params }: Props) {
  const doc = getDoc((await params).slug.join("/"));
  if (!doc) notFound();
  const { prev, next } = getNeighbours(doc.slug);
  const isEmpty = LANGS.every((l) => !doc.variants[l]?.body) && !doc.images.length && !doc.visualizations.length;

  return (
    <article className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm text-fg-muted">
        <Link href="/" className="hover:text-fg">
          {SITE.name}
        </Link>
        <ChevronRight className="size-3.5" />
        <Link href={`/${doc.category}`} className="hover:text-fg">
          <L v={doc.categoryTitle} />
        </Link>
        {doc.group && (
          <>
            <ChevronRight className="size-3.5" />
            <span>
              <L v={doc.group} />
            </span>
          </>
        )}
        {doc.slug !== doc.category && (
          <>
            <ChevronRight className="size-3.5" />
            <span className="text-fg">
              <L v={doc.title} />
            </span>
          </>
        )}
      </nav>

      <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
        <L v={doc.title} />
      </h1>

      <div className="prose mt-6 max-w-none dark:prose-invert prose-headings:scroll-mt-20 prose-pre:overflow-x-auto">
        {isEmpty ? (
          <p className="text-fg-muted italic">This topic is still being written.</p>
        ) : (
          LANGS.map((l) => {
            const v = doc.variants[l] ?? doc.variants.en;
            return (
              <div key={l} className={`l-${l}`} lang={l === "hi" ? "hi" : undefined}>
                <Markdown body={v.body} />
              </div>
            );
          })
        )}

        {doc.images.map((img) => (
          <figure key={img} className="not-prose my-8">
            {/* eslint-disable-next-line @next/next/no-img-element -- repo images of unknown size */}
            <img src={assetUrl(img)} alt={caption(img)} loading="lazy" className="md-img" />
            <figcaption className="mt-2 text-center text-sm text-fg-muted">{caption(img)}</figcaption>
          </figure>
        ))}

        {doc.visualizations.map((v) => (
          <figure key={v} className="not-prose my-8">
            <iframe
              src={assetUrl(v)}
              sandbox="allow-scripts"
              title={caption(v)}
              className="h-[70vh] w-full rounded-lg border border-border bg-white"
            />
            <figcaption className="mt-2 flex justify-between text-sm text-fg-muted">
              <span>{caption(v)}</span>
              <a href={assetUrl(v)} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-accent">
                <Maximize2 className="size-3.5" /> Open full screen
              </a>
            </figcaption>
          </figure>
        ))}
      </div>

      <nav className="mt-12 grid gap-4 border-t border-border pt-6 sm:grid-cols-2" aria-label="Pagination">
        {prev ? (
          <Link href={prev.url} className="group rounded-lg border border-border p-4 hover:border-accent/60">
            <span className="flex items-center gap-1 text-xs text-fg-muted">
              <ChevronLeft className="size-3.5" /> Previous
            </span>
            <span className="mt-1 block font-medium group-hover:text-accent">
              <L v={prev.title} />
            </span>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link href={next.url} className="group rounded-lg border border-border p-4 text-right hover:border-accent/60">
            <span className="flex items-center justify-end gap-1 text-xs text-fg-muted">
              Next <ChevronRight className="size-3.5" />
            </span>
            <span className="mt-1 block font-medium group-hover:text-accent">
              <L v={next.title} />
            </span>
          </Link>
        )}
      </nav>
    </article>
  );
}
