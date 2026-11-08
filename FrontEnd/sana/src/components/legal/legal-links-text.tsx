import type { ReactNode } from "react";
import { LEGAL_LINKS } from "@/content/legal";

const LINKS = [LEGAL_LINKS.privacyPolicy, LEGAL_LINKS.terms];
const PATTERN = new RegExp(`(${LINKS.map((link) => link.label).join("|")})`);

/** True when the text already names the privacy policy. */
export function mentionsPrivacyPolicy(text: string): boolean {
  return text.includes(LEGAL_LINKS.privacyPolicy.label);
}

type Segment = { key: string; text: string; href?: string };

/**
 * Splits the text into plain parts and links. Each key combines the part's
 * position in the text with its content, so it is stable for a given text.
 */
function toSegments(text: string): Segment[] {
  let offset = 0;
  return text.split(PATTERN).flatMap((part) => {
    const start = offset;
    offset += part.length;
    if (!part) return [];
    const link = LINKS.find((candidate) => candidate.label === part);
    return [{ key: `${start}-${part.slice(0, 16)}`, text: part, href: link?.href }];
  });
}

/**
 * Renders a legal text turning every mention of the privacy policy or the
 * terms into a link that opens the full document in a new tab.
 */
export default function LegalLinksText({ text }: Readonly<{ text: string }>): ReactNode {
  return toSegments(text).map((segment) =>
    segment.href ? (
      <a
        key={segment.key}
        href={segment.href}
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold text-primary underline underline-offset-2 hover:text-primary-dark"
      >
        {segment.text}
      </a>
    ) : (
      <span key={segment.key}>{segment.text}</span>
    ),
  );
}
