import Link from "next/link";
import ReactMarkdown, { type Components } from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";

const text = (node: React.ReactNode): string =>
  typeof node === "string" || typeof node === "number"
    ? String(node)
    : Array.isArray(node)
      ? node.map(text).join("")
      : node && typeof node === "object" && "props" in node
        ? text((node.props as { children?: React.ReactNode }).children)
        : "";

/** GitHub-style heading id so "#section" links keep working. */
const headingId = (children: React.ReactNode) =>
  text(children)
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\p{M}\s-]/gu, "")
    .replace(/\s/g, "-");

const components: Components = {
  h2: ({ children }) => <h2 id={headingId(children)}>{children}</h2>,
  h3: ({ children }) => <h3 id={headingId(children)}>{children}</h3>,
  table: ({ children }) => (
    <div className="not-prose my-6 overflow-x-auto rounded-lg border border-border">
      <table className="md-table">{children}</table>
    </div>
  ),
  a: ({ href = "", children }) =>
    href.startsWith("/") && !href.startsWith("/content/") ? (
      <Link href={href}>{children}</Link>
    ) : (
      <a href={href} {...(/^https?:/.test(href) ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {children}
      </a>
    ),
  img: ({ src, alt }) => (
    // eslint-disable-next-line @next/next/no-img-element -- repo images of unknown size, served as-is
    <img src={typeof src === "string" ? src : undefined} alt={alt ?? ""} loading="lazy" className="md-img" />
  ),
};

export function Markdown({ body }: { body: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={components}>
      {body}
    </ReactMarkdown>
  );
}
