import fs from "node:fs";
import path from "node:path";

export const LANGS = ["en", "hi", "hinglish"] as const;
export type Lang = (typeof LANGS)[number];
export type Localized = Partial<Record<Lang, string>> & { en: string };

export type Variant = { title: string; description: string; body: string };

export type Doc = {
  slug: string;
  url: string;
  category: string;
  categoryTitle: Localized;
  group?: Localized;
  title: Localized;
  description: string;
  variants: Partial<Record<Lang, Variant>> & { en: Variant };
  /** Repo-relative paths of images placed on this page (not linked in the body). */
  images: string[];
  /** Repo-relative paths of HTML visualizations. */
  visualizations: string[];
  /** Repo-relative path of the English source (or folder for image-only pages). */
  source: string;
  dir: string;
};

export type Category = { slug: string; title: Localized; docs: Doc[] };

export const IMAGE_EXTS = [".svg", ".png", ".jpg", ".jpeg", ".webp", ".gif"];
export const ASSET_EXTS = [...IMAGE_EXTS, ".html"];
export const SKIP_DIRS = new Set(["website", "node_modules", ".git", ".claude", ".next"]);
/** Images in the repo that belong to no page. Keep empty unless agreed. */
export const IGNORED_IMAGES: string[] = [];

export const REPO_URL = "https://github.com/Ashukr321/Linux-for-Developers-and-DevOps";

/** File names with typos, mapped to the name used for the title and URL. */
const NAME_FIXES: Record<string, string> = {
  "applicaitons of unix sysetem": "Applications of Unix Systems",
};

const CATEGORY_TITLES: Record<string, Partial<Record<Lang, string>>> = {
  introduction: { hi: "परिचय" },
  filesystem: { hi: "फ़ाइल सिस्टम" },
  processes: { hi: "प्रोसेस" },
  commands: { hi: "कमांड्स" },
  "shell-scripting": { hi: "शेल स्क्रिप्टिंग" },
  "sed-and-awk": { hi: "sed और awk" },
  "system-administration": { hi: "सिस्टम एडमिनिस्ट्रेशन" },
  "projects-and-use-cases": { hi: "प्रोजेक्ट्स और यूज़ केस", hinglish: "Projects aur Use Cases" },
  "text-editors": { hi: "टेक्स्ट एडिटर्स" },
  overview: { hi: "अवलोकन" },
};

const ACRONYMS = new Set(
  "api cli cpu cui gui ssh fhs lvm os pid ram xss csrf url http dns io uefi bios grub ui ux".split(" "),
);

const SMALL_WORDS = new Set(["and", "or", "of", "the", "in", "to", "vs"]);
/** Command names that stay lower-case in titles. */
const TOOLS = new Set(["sed", "awk", "vi", "vim", "cron", "grep"]);

export const contentRoot = () =>
  process.env.CONTENT_DIR ?? path.join(/*turbopackIgnore: true*/ process.cwd(), "..");

const stripNumber = (name: string) => name.replace(/^\d+[_-]/, "");
export const slugify = (name: string) =>
  stripNumber(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const humanize = (name: string) =>
  stripNumber(name)
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((w, i) =>
      ACRONYMS.has(w.toLowerCase())
        ? w.toUpperCase()
        : (i > 0 && SMALL_WORDS.has(w.toLowerCase())) || TOOLS.has(w.toLowerCase())
          ? w.toLowerCase()
          : w[0].toUpperCase() + w.slice(1),
    )
    .join(" ");

const fixedName = (base: string) => NAME_FIXES[base] ?? base;

/** "x.hi.md" → ["x", "hi"]; "x.md" → ["x", "en"] */
function splitLang(file: string): [string, Lang] {
  const m = file.match(/^(.*?)(?:\.(hi|hinglish))?\.md$/i);
  return [m![1], (m![2]?.toLowerCase() as Lang) ?? "en"];
}

function readDir(rel: string) {
  return fs
    .readdirSync(path.join(/*turbopackIgnore: true*/ contentRoot(), rel), { withFileTypes: true })
    .filter((e) => !SKIP_DIRS.has(e.name) && !e.name.startsWith("."))
    .sort((a, b) => a.name.localeCompare(b.name));
}

const read = (rel: string) =>
  fs.readFileSync(path.join(/*turbopackIgnore: true*/ contentRoot(), rel), "utf8").replace(/\r\n/g, "\n");

/** Every servable asset in the repo, repo-relative with "/" separators. */
export function listAssets(rel = ""): string[] {
  return readDir(rel).flatMap((e) => {
    const p = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) return listAssets(p);
    return ASSET_EXTS.includes(path.extname(e.name).toLowerCase()) ? [p] : [];
  });
}

const isImage = (p: string) => IMAGE_EXTS.includes(path.extname(p).toLowerCase());
export const assetUrl = (p: string) => "/content/" + p.split("/").map(encodeURIComponent).join("/");

// ---------- markdown parsing ----------

function parseVariant(raw: string, fallbackTitle: string, forceTitle?: string): Variant & { empty: boolean } {
  let body = raw.trim();
  let title = fallbackTitle;
  const h1 = body.match(/^#\s+(.+?)\s*#*\s*$/m);
  if (h1 && body.slice(0, h1.index).trim() === "") {
    const text = h1[1].trim();
    if (forceTitle || text.length <= 60) body = body.slice(h1.index! + h1[0].length).trim();
    if (!forceTitle && text.length <= 60) title = text;
  }
  if (forceTitle) title = forceTitle;
  return { title, body, description: describe(body), empty: body === "" };
}

const plain = (s: string) =>
  s
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/[*_`~]+/g, "")
    .replace(/\s+/g, " ")
    .trim();

function describe(body: string) {
  let inFence = false;
  for (const para of body.split(/\n\s*\n/)) {
    const t = para.trim();
    if (t.startsWith("```")) inFence = !inFence && !/```[\s\S]*```/.test(t);
    if (inFence || !t || /^(#|!\[|\||>|```|<|---|[-*+]\s|\d+\.\s)/.test(t)) continue;
    const text = plain(t);
    if (text.length < 20) continue;
    if (text.length <= 160) return text;
    const cut = text.slice(0, 157);
    return cut.slice(0, cut.lastIndexOf(" ")) + "…";
  }
  return "";
}

const LINK_RE = /(!?)\[([^\]]*)\]\(((?:[^()\s]|\([^()\s]*\))+)(\s+"[^"]*")?\)/g;
const IMG_TAG_RE = /(<img\b[^>]*?\bsrc=["'])([^"']+)(["'])/gi;
const isExternal = (href: string) => /^([a-z]+:|#|\/\/)/i.test(href);

function resolveRel(dir: string, href: string) {
  let decoded = href;
  try {
    decoded = decodeURIComponent(href);
  } catch {}
  return path.posix.normalize(path.posix.join(dir, decoded)).replace(/^\.\//, "");
}

/** Applies fn to the parts of a markdown body that are outside fenced code blocks. */
function outsideCode(body: string, fn: (s: string) => string) {
  return body
    .split(/(^```[\s\S]*?^```)/m)
    .map((part, i) => (i % 2 ? part : fn(part)))
    .join("");
}

export function linkedImages(body: string, dir: string): string[] {
  const found: string[] = [];
  outsideCode(body, (s) => {
    for (const m of s.matchAll(LINK_RE)) if (m[1] && !isExternal(m[3])) found.push(resolveRel(dir, m[3]));
    for (const m of s.matchAll(IMG_TAG_RE)) if (!isExternal(m[2])) found.push(resolveRel(dir, m[2]));
    return s;
  });
  return found;
}

// ---------- loader ----------

type Draft = Omit<Doc, "url" | "variants" | "description"> & {
  raw: Partial<Record<Lang, string>>;
  forceTitle?: Localized;
  fallbackTitle: string;
};

function scanFolder(rel: string, category: string, categoryTitle: Localized, slugBase: string, group?: Localized): Draft[] {
  const entries = readDir(rel);
  const files = new Map<string, Partial<Record<Lang, string>>>();
  for (const e of entries) {
    if (!e.isFile() || !/\.md$/i.test(e.name)) continue;
    const [base, lang] = splitLang(e.name);
    files.set(base, { ...files.get(base), [lang]: `${rel}/${e.name}` });
  }
  const make = (base: string, sources: Partial<Record<Lang, string>>): Draft => {
    const isReadme = /^(readme|concept)$/i.test(base);
    const folderTitle: Localized = group ?? categoryTitle;
    const name = fixedName(base);
    return {
      slug: isReadme ? slugBase : `${slugBase}/${slugify(name)}`,
      category,
      categoryTitle,
      group,
      title: { en: "" },
      images: [],
      visualizations: [],
      source: (sources.en ?? sources.hi ?? sources.hinglish)!,
      dir: rel,
      raw: sources,
      forceTitle: isReadme ? folderTitle : undefined,
      fallbackTitle: humanize(name),
    };
  };
  const readme = [...files.keys()].find((b) => /^readme$/i.test(b));
  const drafts: Draft[] = [];
  if (readme) drafts.push(make(readme, files.get(readme)!));
  for (const [base, sources] of files) if (base !== readme) drafts.push(make(base, sources));

  // HTML visualizations live next to a README.
  const htmls = entries.filter((e) => e.isFile() && /\.html$/i.test(e.name)).map((e) => `${rel}/${e.name}`);
  if (readme && htmls.length) drafts[0].visualizations.push(...htmls);

  // A folder with images but no markdown still gets a page.
  if (!files.size && entries.some((e) => e.isFile() && isImage(e.name)) && group) {
    drafts.push({ ...make("readme", {}), source: rel, raw: {} });
  }

  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const sub = `${rel}/${e.name}`;
    const t = humanize(e.name);
    const subGroup: Localized = group ? { en: `${group.en} / ${t}` } : { en: t };
    drafts.push(...scanFolder(sub, category, categoryTitle, `${slugBase}/${slugify(e.name)}`, subGroup));
  }
  return drafts;
}

let cache: { categories: Category[]; docs: Doc[] } | null = null;

export function loadContent() {
  if (cache) return cache;
  const top = readDir("");
  const catDirs = top.filter((e) => e.isDirectory() && /^\d+[_-]/.test(e.name));
  const categories: { slug: string; title: Localized; drafts: Draft[] }[] = catDirs.map((d) => {
    const slug = slugify(d.name);
    const title: Localized = { en: humanize(d.name), ...CATEGORY_TITLES[slug] };
    return { slug, title, drafts: scanFolder(d.name, slug, title, slug) };
  });

  // Root notes: README → "Overview" first; other loose notes at the end of the first category.
  if (categories.length) {
    const first = categories[0];
    const root = scanFolderRootOnly(first.slug, first.title);
    const overview = root.find((d) => d.slug === first.slug);
    if (overview) {
      overview.slug = `${first.slug}/overview`;
      overview.forceTitle = { en: "Overview", ...CATEGORY_TITLES.overview };
      first.drafts.unshift(overview);
    }
    first.drafts.push(...root.filter((d) => d !== overview));
  }

  const drafts = categories.flatMap((c) => c.drafts);
  const bySource = new Map<string, Draft>();
  for (const d of drafts) for (const src of Object.values(d.raw)) bySource.set(src!, d);
  const assets = new Set(listAssets());
  const allFiles = new Set(listFiles(""));

  const rewrite = (body: string, dir: string) =>
    outsideCode(body, (s) =>
      s
        .replace(LINK_RE, (all, bang: string, label: string, href: string, titleAttr = "") => {
          if (isExternal(href)) return all;
          const [p, hash] = href.split("#");
          const target = resolveRel(dir, p);
          if (bang) return assets.has(target) ? `![${label}](<${assetUrl(target)}>${titleAttr})` : all;
          if (/\.md$/i.test(target)) {
            const [base] = splitLang(target);
            const doc = bySource.get(`${base}.md`) ?? bySource.get(target);
            return doc ? `[${label}](/${doc.slug}${hash ? "#" + hash : ""})` : label;
          }
          if (assets.has(target)) return `[${label}](<${assetUrl(target)}>)`;
          if (allFiles.has(target) || /\.pdf$/i.test(target)) return `[${label}](<${REPO_URL}/blob/main/${target.split("/").map(encodeURIComponent).join("/")}>)`;
          return label;
        })
        .replace(IMG_TAG_RE, (all, pre: string, src: string, post: string) => {
          if (isExternal(src)) return all;
          const target = resolveRel(dir, src);
          return assets.has(target) ? pre + assetUrl(target) + post : all;
        }),
    );

  const docs: Doc[] = drafts.map((d) => {
    const variants = {} as Doc["variants"];
    for (const lang of LANGS) {
      const src = d.raw[lang];
      if (!src && lang !== "en") continue;
      const v = parseVariant(src ? read(src) : "", d.fallbackTitle, d.forceTitle?.[lang] ?? d.forceTitle?.en);
      variants[lang] = { ...v, body: v.empty ? "" : rewrite(v.body, d.dir) };
    }
    if (!d.raw.en && (d.raw.hi || d.raw.hinglish)) variants.en = variants.hi ?? variants.hinglish!;
    const title = Object.fromEntries(LANGS.filter((l) => variants[l]).map((l) => [l, variants[l]!.title])) as Localized;
    return {
      slug: d.slug,
      url: `/${d.slug}`,
      category: d.category,
      categoryTitle: d.categoryTitle,
      group: d.group,
      title,
      description: variants.en.description || `${title.en} — notes on ${d.categoryTitle.en}.`,
      variants,
      images: d.images,
      visualizations: d.visualizations,
      source: d.source,
      dir: d.dir,
    };
  });

  placeImages(docs, [...assets].filter((a) => isImage(a) && !IGNORED_IMAGES.includes(a)), drafts);

  cache = {
    docs,
    categories: categories.map((c) => ({ slug: c.slug, title: c.title, docs: docs.filter((d) => d.category === c.slug) })),
  };
  return cache;
}

function scanFolderRootOnly(category: string, categoryTitle: Localized): Draft[] {
  // Only the root's own .md files, never its sub-folders.
  const entries = readDir("").filter((e) => e.isFile() && /\.md$/i.test(e.name));
  const files = new Map<string, Partial<Record<Lang, string>>>();
  for (const e of entries) {
    const [base, lang] = splitLang(e.name);
    files.set(base, { ...files.get(base), [lang]: e.name });
  }
  return [...files].map(([base, sources]) => {
    const isReadme = /^readme$/i.test(base);
    const name = fixedName(base);
    return {
      slug: isReadme ? category : `${category}/${slugify(name)}`,
      category,
      categoryTitle,
      title: { en: "" },
      images: [],
      visualizations: [],
      source: (sources.en ?? sources.hi ?? sources.hinglish)!,
      dir: "",
      raw: sources,
      fallbackTitle: name === base ? humanize(name) : name,
    };
  });
}

function listFiles(rel: string): string[] {
  return readDir(rel).flatMap((e) => {
    const p = rel ? `${rel}/${e.name}` : e.name;
    return e.isDirectory() ? listFiles(p) : [p];
  });
}

const words = (name: string) =>
  path.posix
    .basename(name, path.posix.extname(name))
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w && !/^\d+$/.test(w));

/** Puts every image that no markdown links onto the most fitting page. */
function placeImages(docs: Doc[], images: string[], drafts: Draft[]) {
  const linkedBy = new Map<string, Doc[]>();
  docs.forEach((doc, i) => {
    for (const src of Object.values(drafts[i].raw)) {
      for (const img of linkedImages(read(src!), doc.dir)) {
        if (!linkedBy.has(img)) linkedBy.set(img, []);
        if (!linkedBy.get(img)!.includes(doc)) linkedBy.get(img)!.push(doc);
      }
    }
  });
  const stem = (p: string) => p.replace(/\.[^./]+$/, "");
  for (const img of images) {
    if (linkedBy.has(img)) continue;
    // 1. A sibling with the same name (e.g. .svg next to .png) is linked somewhere.
    const sibling = [...linkedBy.keys()].find((k) => stem(k) === stem(img));
    if (sibling) {
      linkedBy.get(sibling)!.forEach((d) => d.images.push(img));
      continue;
    }
    // 2. Every word of the image name appears in a doc's file name.
    const iw = words(img);
    const byName = docs.filter((d) => {
      const dw = new Set(words(d.source));
      return iw.length > 0 && iw.every((w) => dw.has(w));
    });
    if (byName.length) {
      byName.forEach((d) => d.images.push(img));
      continue;
    }
    // 3. Nearest doc in its folder, else the nearest parent folder (README / overview preferred).
    let dir = path.posix.dirname(img);
    if (dir === ".") dir = "";
    for (;;) {
      const here = docs.filter((d) => d.dir === dir);
      const pick = here.find((d) => /(^|\/)readme(\.md)?$/i.test(d.source)) ?? here[0];
      if (pick) {
        pick.images.push(img);
        break;
      }
      if (!dir) break;
      dir = dir.includes("/") ? dir.slice(0, dir.lastIndexOf("/")) : "";
    }
  }
}

export const getDoc = (slug: string) => loadContent().docs.find((d) => d.slug === slug);

export function getNeighbours(slug: string) {
  const { docs } = loadContent();
  const i = docs.findIndex((d) => d.slug === slug);
  return { prev: i > 0 ? docs[i - 1] : undefined, next: i >= 0 ? docs[i + 1] : undefined };
}
