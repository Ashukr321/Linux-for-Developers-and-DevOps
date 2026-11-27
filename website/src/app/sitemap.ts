import type { MetadataRoute } from "next";
import { loadContent } from "@/lib/content";
import { SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE.url, changeFrequency: "weekly", priority: 1 },
    ...loadContent().docs.map((d) => ({
      url: `${SITE.url}${d.url}`,
      changeFrequency: "monthly" as const,
      priority: d.slug === d.category ? 0.8 : 0.6,
    })),
  ];
}
