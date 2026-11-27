import { Shell, type NavCategory } from "@/components/Shell";
import { loadContent } from "@/lib/content";
import { SITE } from "@/lib/site";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const nav: NavCategory[] = loadContent().categories.map((c) => ({
    slug: c.slug,
    title: c.title,
    url: `/${c.slug}`,
    docs: c.docs.map((d) => ({ slug: d.slug, url: d.url, title: d.title, group: d.group })),
  }));
  return (
    <Shell siteName={SITE.name} nav={nav}>
      {children}
    </Shell>
  );
}
