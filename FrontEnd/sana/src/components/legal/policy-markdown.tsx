import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Defines the safe url.
 */
const SAFE_URL = /^(https?:|mailto:|tel:|\/)/i;

/**
 * Defines the components.
 */
const COMPONENTS: Components = {
  h1: ({ children }) => (
    <h1 className="font-display text-3xl font-extrabold text-primary-dark sm:text-4xl">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="pt-4 font-display text-xl font-bold text-primary-dark">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="pt-2 font-semibold text-text">{children}</h3>
  ),
  p: ({ children }) => <p className="leading-relaxed">{children}</p>,
  ul: ({ children }) => <ul className="list-disc space-y-2 pl-6">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal space-y-2 pl-6">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => (
    <strong className="font-semibold text-text">{children}</strong>
  ),
  a: ({ href, children }) => {
    const isExternal = Boolean(href && /^https?:/i.test(href));
    return (
      <a
        href={href}
        className="font-semibold text-primary underline underline-offset-2 hover:text-primary-dark"
        {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {children}
      </a>
    );
  },
  table: ({ children }) => (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-primary-soft/40">{children}</thead>,
  th: ({ children }) => (
    <th className="border-b border-border px-4 py-3 font-semibold text-text">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-b border-border px-4 py-3 align-top">{children}</td>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-primary/40 pl-4">{children}</blockquote>
  ),
};

/**
 * Renders an approved legal text stored as Markdown in policy_documents.
 * Raw HTML is never rendered. Works in server and client components.
 * @param props Component properties.
 */
export default function PolicyMarkdown({
  children,
  className = "",
}: Readonly<{
  children: string;
  className?: string;
}>) {
  return (
    <div className={`space-y-4 text-sm text-text-muted sm:text-base ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        urlTransform={(url) => (SAFE_URL.test(url) ? url : "")}
        components={COMPONENTS}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
