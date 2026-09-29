import ReactMarkdown from "react-markdown";

const ALLOWED_ELEMENTS = ["p", "strong", "em", "a", "br"];
const SAFE_URL = /^(https?:|mailto:)/i;

/** Renders the limited Markdown used in news: bold, italic and links. Raw HTML is never rendered. */
export default function MarkdownText({
  children,
  className = "",
}: {
  children: string;
  className?: string;
}) {
  return (
    <div className={`space-y-4 ${className}`}>
      <ReactMarkdown
        allowedElements={ALLOWED_ELEMENTS}
        unwrapDisallowed
        skipHtml
        urlTransform={(url) => (SAFE_URL.test(url) ? url : "")}
        components={{
          a: ({ href, children: label }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="font-semibold text-primary underline underline-offset-2 hover:text-primary-dark"
            >
              {label}
            </a>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
