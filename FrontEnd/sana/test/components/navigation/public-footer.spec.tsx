// @vitest-environment jsdom

import type { ImgHTMLAttributes } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import PublicFooter from "@/components/navigation/public-footer";
import { LEGAL_CONTACT } from "@/content/legal";

vi.mock("next/image", () => ({
  default: (props: ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} alt={props.alt ?? ""} />
  ),
}));

afterEach(cleanup);

function emailLinks() {
  return screen
    .getAllByRole("link")
    .filter((link) => link.getAttribute("href") === `mailto:${LEGAL_CONTACT.email}`);
}

describe("PublicFooter", () => {
  it("muestra el teléfono con el indicativo +57", () => {
    render(<PublicFooter />);

    const phone = screen.getByRole("link", { name: "+57 320 972 2813" });
    expect(phone.getAttribute("href")?.startsWith("tel:+57")).toBe(true);
  });

  it("no parte el correo en mitad de una palabra", () => {
    render(<PublicFooter />);

    const links = emailLinks();
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link.className).not.toContain("break-all");
    }
  });

  it("ofrece un punto de corte antes de la arroba del correo", () => {
    render(<PublicFooter />);

    for (const link of emailLinks()) {
      const wbr = link.querySelector("wbr");
      expect(wbr).not.toBeNull();
      expect(wbr?.nextSibling?.textContent?.startsWith("@")).toBe(true);
    }
  });
});
