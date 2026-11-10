// @vitest-environment jsdom

import type { ReactNode } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Sidebar from "@/components/navigation/sidebar";

vi.mock("next/navigation", () => ({ usePathname: () => "/reportes" }));
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
  }: {
    href: string;
    children: ReactNode;
  }) => <a href={href}>{children}</a>,
}));

describe("reports navigation", () => {
  afterEach(() => cleanup());

  it("shows the reports section to administrators", () => {
    render(<Sidebar roles={["administrador"]} fullName="Admin Ejemplo" />);

    expect(screen.getByRole("link", { name: "Reportes" }).getAttribute("href")).toBe(
      "/reportes",
    );
  });

  it("does not show the reports section to other roles", () => {
    render(<Sidebar roles={["marketing"]} fullName="Marketing Ejemplo" />);

    expect(screen.queryByRole("link", { name: "Reportes" })).toBeNull();
  });
});
