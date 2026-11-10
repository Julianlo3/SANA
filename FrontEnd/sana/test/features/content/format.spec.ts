import { describe, expect, it } from "vitest";
import {
  formatDate,
  padNumber,
  toExcerpt,
  toNewsTeaser,
} from "../../../src/features/content/format";
import type { PublicNews } from "../../../src/features/content/types/content-types";

function publicNews(overrides: Partial<PublicNews> = {}): PublicNews {
  return {
    id: 7,
    title: "Jornada de juego con las familias",
    body: "Acompañamos a **las familias** con talleres de lectura.",
    imageUrl: "https://res.cloudinary.com/demo/image/upload/v1/sana/news/foto.jpg",
    imageAlt: "Niñas y niños leyendo",
    isPinned: true,
    publishedAt: "2026-11-09T15:00:00.000Z",
    ...overrides,
  };
}

describe("toExcerpt", () => {
  it("removes the limited Markdown and collapses spaces", () => {
    expect(toExcerpt("Hola **mundo**\n\n[enlace](https://example.org)   _cursiva_")).toBe(
      "Hola mundo enlace cursiva",
    );
  });

  it("keeps a text that already fits", () => {
    expect(toExcerpt("uno dos tres", 12)).toBe("uno dos tres");
  });

  it("cuts at the last whole word", () => {
    expect(toExcerpt("uno dos tres cuatro cinco", 10)).toBe("uno dos…");
  });

  it("drops the punctuation left before the ellipsis", () => {
    expect(toExcerpt("Hola, mundo. Adiós amigos", 12)).toBe("Hola, mundo…");
  });

  it("cuts inside a long word when there is no space close to the limit", () => {
    expect(toExcerpt("abcdefghijklmnop qr", 10)).toBe("abcdefghij…");
  });
});

describe("toNewsTeaser", () => {
  it("keeps the fields the public cards need and turns the body into an excerpt", () => {
    expect(toNewsTeaser(publicNews())).toEqual({
      id: 7,
      title: "Jornada de juego con las familias",
      excerpt: "Acompañamos a las familias con talleres de lectura.",
      imageUrl: "https://res.cloudinary.com/demo/image/upload/v1/sana/news/foto.jpg",
      imageAlt: "Niñas y niños leyendo",
      isPinned: true,
      publishedAt: "2026-11-09T15:00:00.000Z",
    });
  });

  it("uses the requested excerpt length and keeps a missing image empty", () => {
    const teaser = toNewsTeaser(
      publicNews({ body: "uno dos tres cuatro cinco", imageUrl: null, imageAlt: null }),
      10,
    );

    expect(teaser.excerpt).toBe("uno dos…");
    expect(teaser.imageUrl).toBeNull();
    expect(teaser.imageAlt).toBeNull();
  });
});

describe("padNumber", () => {
  it("pads single digits with a leading zero", () => {
    expect(padNumber(3)).toBe("03");
    expect(padNumber(12)).toBe("12");
  });
});

describe("formatDate", () => {
  it("shows the date in Bogotá time", () => {
    expect(formatDate("2026-11-10T03:00:00.000Z")).toBe("9 de noviembre de 2026");
  });
});
