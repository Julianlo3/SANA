// @vitest-environment jsdom

import type { ImgHTMLAttributes } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import HeroCarousel, { type HeroSlide } from "@/features/content/components/hero-carousel";

vi.mock("next/image", () => ({
  default: (props: ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean; priority?: boolean }) => {
    const imageProps = { ...props };
    delete imageProps.fill;
    delete imageProps.priority;
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...imageProps} alt={props.alt ?? ""} />;
  },
}));

beforeAll(() => {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
});

afterEach(cleanup);

const SLIDES: HeroSlide[] = [
  { key: "1", src: "/a.jpg", alt: "Primera foto" },
  { key: "2", src: "/b.jpg", alt: "Segunda foto" },
  { key: "3", src: "/c.jpg", alt: "Tercera foto" },
];

function visibleAlt() {
  const visible = screen
    .getAllByRole("img", { hidden: true })
    .find((image) => image.closest("[aria-hidden]")?.getAttribute("aria-hidden") === "false");
  return visible?.getAttribute("alt");
}

describe("HeroCarousel", () => {
  it("con varias imágenes muestra los controles anterior y siguiente", () => {
    render(<HeroCarousel slides={SLIDES} />);

    expect(screen.getByRole("button", { name: "Imagen anterior" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Imagen siguiente" })).toBeTruthy();
  });

  it("al hacer clic en siguiente cambia la imagen visible", () => {
    render(<HeroCarousel slides={SLIDES} />);

    expect(visibleAlt()).toBe("Primera foto");
    fireEvent.click(screen.getByRole("button", { name: "Imagen siguiente" }));
    expect(visibleAlt()).toBe("Segunda foto");
  });

  it("al deslizar hacia la izquierda pasa a la siguiente imagen", () => {
    const { container } = render(<HeroCarousel slides={SLIDES} />);
    const section = container.querySelector("section")!;

    fireEvent.touchStart(section, { touches: [{ clientX: 200, clientY: 100 }] });
    fireEvent.touchEnd(section, { changedTouches: [{ clientX: 140, clientY: 104 }] });

    expect(visibleAlt()).toBe("Segunda foto");
  });

  it("con una sola imagen no muestra los controles", () => {
    render(<HeroCarousel slides={SLIDES.slice(0, 1)} />);

    expect(screen.queryByRole("button", { name: "Imagen anterior" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Imagen siguiente" })).toBeNull();
  });
});
