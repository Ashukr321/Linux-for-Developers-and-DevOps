import fs from "node:fs/promises";
import path from "node:path";
import { contentRoot, listAssets } from "@/lib/content";

export const dynamicParams = false;

export function generateStaticParams() {
  return listAssets().map((p) => ({ path: p.split("/") }));
}

const TYPES: Record<string, string> = {
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
};

export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const rel = (await params).path.map((s) => decodeURIComponent(s)).join("/");
  // dynamicParams=false already limits this to listed files; double-check at the boundary.
  if (!listAssets().includes(rel)) return new Response("Not found", { status: 404 });
  const file = await fs.readFile(path.join(/*turbopackIgnore: true*/ contentRoot(), rel));
  return new Response(new Uint8Array(file), {
    headers: {
      "Content-Type": TYPES[path.extname(rel).toLowerCase()] ?? "application/octet-stream",
      "Cache-Control": "public, max-age=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
