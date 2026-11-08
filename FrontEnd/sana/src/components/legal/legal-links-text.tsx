import { Fragment, type ReactNode } from "react";
import { LEGAL_LINKS } from "@/content/legal";

const LINKS = [LEGAL_LINKS.privacyPolicy, LEGAL_LINKS.terms];
const PATTERN = new RegExp(`(${LINKS.map((link) => link.label).join("|")})`);

/** True when the text already names the privacy policy. */
export function mentionsPrivacyPolicy(text: string): boolean {
  return text.includes(LEGAL_LINKS.privacyPolicy.label);
}

/**
 * Renders a legal text turning every mention of the privacy policy or the
 * terms into a link that opens the full document in a new tab.
 */
export default function LegalLinksText({ text }: { text: string }): ReactNode {
  return text.split(PATTERN).map((part, index) => {
    const link = LINKS.find((candidate) => candidate.label === part);
    if (!link) return <Fragment key={index}>{part}</Fragment>;
    return (
      <a
        key={index}
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold text-primary underline underline-offset-2 hover:text-primary-dark"
      >
        {part}
      </a>
    );
  });
}
