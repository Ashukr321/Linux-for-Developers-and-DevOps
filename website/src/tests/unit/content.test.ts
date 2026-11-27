// @vitest-environment node
import { describe, expect, it } from "vitest";
import { IGNORED_IMAGES, IMAGE_EXTS, LANGS, assetUrl, getDoc, listAssets, loadContent } from "@/lib/content";

const { docs, categories } = loadContent();
const images = listAssets().filter((a) => IMAGE_EXTS.some((e) => a.toLowerCase().endsWith(e)));

describe("content loader", () => {
  it("has categories and docs", () => {
    expect(categories.length).toBeGreaterThan(0);
    expect(docs.length).toBeGreaterThan(categories.length);
  });

  it("gives every doc a unique, URL-safe slug and a title", () => {
    const slugs = docs.map((d) => d.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const d of docs) {
      expect(d.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*(\/[a-z0-9]+(-[a-z0-9]+)*)*$/);
      expect(d.title.en.trim()).not.toBe("");
    }
  });

  it("maps a README to its folder URL and returns undefined for a missing doc", () => {
    const readme = docs.find((d) => /^\d+_[^/]+\/README\.md$/.test(d.source))!;
    expect(readme.slug).not.toContain("/");
    expect(getDoc(readme.slug)).toBe(readme);
    expect(getDoc("does/not/exist")).toBeUndefined();
  });

  it("puts the root README on an Overview page in the first category", () => {
    const overview = getDoc(`${categories[0].slug}/overview`);
    expect(overview?.source).toBe("README.md");
    expect(overview?.title.en).toBe("Overview");
  });

  it("never titles a doc 'Concept'", () => {
    expect(docs.filter((d) => /^concept$/i.test(d.title.en))).toEqual([]);
  });

  it("loads translations as variants", () => {
    const withAll = docs.filter((d) => LANGS.every((l) => d.variants[l]));
    expect(withAll.length).toBe(docs.length);
  });

  it("shows every repo image on at least one page", () => {
    const missing = images.filter(
      (img) =>
        !IGNORED_IMAGES.includes(img) &&
        !docs.some(
          (d) => d.images.includes(img) || Object.values(d.variants).some((v) => v!.body.includes(assetUrl(img))),
        ),
    );
    expect(missing).toEqual([]);
  });

  it("rewrites note links to doc URLs and leaves no .md links", () => {
    for (const d of docs)
      for (const v of Object.values(d.variants)) {
        const outside = v!.body.replace(/```[\s\S]*?```/g, "");
        expect(outside, d.slug).not.toMatch(/\]\([^)]*\.md(#[^)]*)?\)/);
      }
  });

  it("serves no asset from website/, .git or .claude", () => {
    expect(listAssets().filter((a) => /^(website|\.git|\.claude)\//.test(a))).toEqual([]);
  });
});

describe("fixture repo", () => {
  it("gives an image-only folder its own page and places unlinked images", async () => {
    const fs = await import("node:fs");
    const os = await import("node:os");
    const path = await import("node:path");
    const { vi } = await import("vitest");
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "notes-"));
    const w = (p: string, s = "") => {
      fs.mkdirSync(path.dirname(path.join(root, p)), { recursive: true });
      fs.writeFileSync(path.join(root, p), s);
    };
    w("README.md", "# Repo\n\nThe repository overview paragraph for testing.");
    w("01_Intro/README.md", "# Intro\n\nIntro text that is long enough to describe.");
    w("01_Intro/validation-vs-escaping.md", "");
    w("01_Intro/validation.svg", "<svg/>");
    w("01_Intro/diagrams/flow.svg", "<svg/>");
    w("website/package.json", "{}");
    process.env.CONTENT_DIR = root;
    vi.resetModules();
    const c = await import("@/lib/content");
    const { docs } = c.loadContent();
    delete process.env.CONTENT_DIR;

    expect(c.getDoc("intro/diagrams")?.images).toEqual(["01_Intro/diagrams/flow.svg"]);
    expect(c.getDoc("intro/validation-vs-escaping")?.images).toEqual(["01_Intro/validation.svg"]);
    expect(c.getDoc("intro/validation-vs-escaping")?.variants.en.body).toBe("");
    expect(c.getDoc("intro/overview")?.title.en).toBe("Overview");
    expect(c.listAssets()).not.toContain("website/package.json");
    expect(docs.length).toBe(4);
    fs.rmSync(root, { recursive: true, force: true });
  });
});
