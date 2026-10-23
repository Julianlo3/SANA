import { beforeEach, describe, expect, it, vi } from "vitest";
import { ENDPOINTS } from "@/services/api/endpoints";
import { httpClient } from "@/services/api/http-client";
import {
  getConsultantForAssistant,
  getConsultantForPsychologist,
} from "@/features/consultants/services/consultants-service";
import {
  createContentCard,
  saveContentItems,
  updateContentCard,
} from "@/features/content/services/content-service";
import {
  createNews,
  updateNews,
  updateNewsStatus,
} from "@/features/content/services/news-service";
import {
  createGalleryImage,
  updateGalleryImage,
  updateGalleryImageStatus,
} from "@/features/content/services/gallery-service";
import {
  createBanner,
  updateBanner,
  updateBannerActivation,
} from "@/features/content/services/banners-service";
import { validateImageFile } from "@/features/content/services/image-upload-service";
import {
  buildCardValidator,
  validateMissionVision,
} from "@/features/content/validation/content-validation";
import {
  CARD_SECTIONS,
  IMAGE_RULES_MESSAGE,
} from "@/features/content/config/content-sections";

vi.mock("@/services/api/http-client", () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    remove: vi.fn(),
  },
}));

const imageUrl = "https://res.cloudinary.com/sana/image/upload/example.jpg";

describe("consultant and content services for HU-2.1 and HU-4.1–HU-4.3", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("maps an administrative consultant summary without exposing clinical details", async () => {
    vi.mocked(httpClient.get).mockResolvedValueOnce({
      id: 41,
      fullName: "Ana Consultante",
      identityDocument: "12345678",
      email: "ana@example.com",
      phone: "3001234567",
      status: "blocked",
      appointmentCount: 2,
      lastAppointmentDate: "2026-10-01T15:00:00.000Z",
      assignedPsychologistName: "Psicóloga",
    });

    await expect(getConsultantForAssistant(41)).resolves.toEqual({
      id: 41,
      fullName: "Ana Consultante",
      identityDocument: "12345678",
      email: "ana@example.com",
      phone: "3001234567",
      residence: null,
      status: "inactive",
      assignedPsychologistId: null,
      assignedPsychologistName: "Psicóloga",
      lastAppointmentAt: "2026-10-01T15:00:00.000Z",
      appointmentCount: 2,
    });
    expect(httpClient.get).toHaveBeenCalledWith(ENDPOINTS.consultantSummary(41));
  });

  it("requests the psychologist's authorized full consultant record from its dedicated endpoint", async () => {
    const record = {
      id: 41,
      fullName: "Ana Consultante",
      appointments: [{ id: 9, clinicalNotes: [] }],
      careRecords: [],
    };
    vi.mocked(httpClient.get).mockResolvedValueOnce(record);

    await expect(getConsultantForPsychologist(41)).resolves.toBe(record);
    expect(httpClient.get).toHaveBeenCalledWith(
      ENDPOINTS.consultantFullRecord(41),
    );
  });

  it("validates required institutional text and the required team card fields", () => {
    expect(validateMissionVision({ mission: " ", vision: "" })).toEqual({
      mission: "Escribe la misión.",
      vision: "Escribe la visión.",
    });

    const teamValidator = buildCardValidator(
      CARD_SECTIONS.find((section) => section.section === "team")!,
    );
    expect(
      teamValidator({
        title: "",
        subtitle: "",
        description: "",
        imageUrl: "",
        imageAlt: "",
        isActive: true,
      }),
    ).toMatchObject({
      title: "Nombre es obligatorio.",
      subtitle: "Cargo es obligatorio.",
      imageUrl: "Foto es obligatoria.",
    });
  });

  it("accepts only the configured image formats and maximum upload size", () => {
    const valid = new File(["image"], "banner.webp", { type: "image/webp" });
    const wrongType = new File(["image"], "banner.gif", { type: "image/gif" });
    const oversized = new File(
      [new Uint8Array(5 * 1024 * 1024 + 1)],
      "banner.png",
      { type: "image/png" },
    );

    expect(validateImageFile(valid)).toBeNull();
    expect(validateImageFile(wrongType)).toBe(IMAGE_RULES_MESSAGE);
    expect(validateImageFile(oversized)).toBe(IMAGE_RULES_MESSAGE);
  });

  it("saves mission and vision content and updates the public-facing card payload", async () => {
    const items = [
      { key: "about.mission" as const, value: "Support families." },
      { key: "about.vision" as const, value: "A stronger community." },
    ];
    const card = { id: 1, section: "values", title: "Compassion" };
    vi.mocked(httpClient.patch)
      .mockResolvedValueOnce(items)
      .mockResolvedValueOnce(card);

    await expect(saveContentItems(items)).resolves.toBe(items);
    expect(httpClient.patch).toHaveBeenNthCalledWith(
      1,
      ENDPOINTS.contentItems,
      { items },
    );

    await expect(
      updateContentCard(1, { title: "Respect" }),
    ).resolves.toBe(card);
    expect(httpClient.patch).toHaveBeenNthCalledWith(
      2,
      ENDPOINTS.contentCard(1),
      { title: "Respect" },
    );
  });

  it("creates a content card with its section and omits empty optional fields", async () => {
    const card = { id: 2, section: "values", title: "Respect" };
    vi.mocked(httpClient.post).mockResolvedValueOnce(card);

    await expect(
      createContentCard("values", {
        title: "Respect",
        subtitle: null,
        description: null,
        imageUrl: null,
        imageAlt: null,
        isActive: true,
      }),
    ).resolves.toBe(card);
    expect(httpClient.post).toHaveBeenCalledWith(ENDPOINTS.contentCards, {
      section: "values",
      title: "Respect",
      subtitle: undefined,
      description: undefined,
      imageUrl: undefined,
      imageAlt: undefined,
      isActive: true,
    });
  });

  it("publishes news and retires it through the status endpoint", async () => {
    const news = { id: 6, title: "Community event", status: "published" };
    vi.mocked(httpClient.post).mockResolvedValueOnce(news);
    vi.mocked(httpClient.patch).mockResolvedValueOnce({
      ...news,
      status: "retired",
    });

    await expect(
      createNews({
        title: "Community event",
        body: "Event details",
        imageUrl: null,
        imageAlt: null,
      }),
    ).resolves.toBe(news);
    expect(httpClient.post).toHaveBeenCalledWith(ENDPOINTS.news, {
      title: "Community event",
      body: "Event details",
      imageUrl: undefined,
      imageAlt: undefined,
    });

    await expect(updateNewsStatus(6, "retired")).resolves.toMatchObject({
      status: "retired",
    });
    expect(httpClient.patch).toHaveBeenCalledWith(ENDPOINTS.newsStatus(6), {
      status: "retired",
    });
  });

  it("edits existing news through its item endpoint", async () => {
    const news = { id: 6, title: "Updated title" };
    vi.mocked(httpClient.patch).mockResolvedValueOnce(news);

    await expect(updateNews(6, { title: "Updated title" })).resolves.toBe(news);
    expect(httpClient.patch).toHaveBeenCalledWith(ENDPOINTS.newsItem(6), {
      title: "Updated title",
    });
  });

  it("adds a gallery image and changes its publication status", async () => {
    const galleryImage = {
      id: 8,
      imageUrl,
      imageAlt: "Community event",
      caption: null,
      status: "published",
    };
    vi.mocked(httpClient.post).mockResolvedValueOnce(galleryImage);
    vi.mocked(httpClient.patch).mockResolvedValueOnce({
      ...galleryImage,
      status: "retired",
    });

    await expect(
      createGalleryImage({
        imageUrl,
        imageAlt: "Community event",
        caption: null,
      }),
    ).resolves.toBe(galleryImage);
    expect(httpClient.post).toHaveBeenCalledWith(ENDPOINTS.galleryImages, {
      imageUrl,
      imageAlt: "Community event",
      caption: undefined,
    });

    await expect(
      updateGalleryImageStatus(8, "retired"),
    ).resolves.toMatchObject({ status: "retired" });
    expect(httpClient.patch).toHaveBeenCalledWith(
      ENDPOINTS.galleryImageStatus(8),
      { status: "retired" },
    );
  });

  it("edits an existing gallery image through its item endpoint", async () => {
    const galleryImage = { id: 8, caption: "Updated caption" };
    vi.mocked(httpClient.patch).mockResolvedValueOnce(galleryImage);

    await expect(
      updateGalleryImage(8, { caption: "Updated caption" }),
    ).resolves.toBe(galleryImage);
    expect(httpClient.patch).toHaveBeenCalledWith(
      ENDPOINTS.galleryImage(8),
      { caption: "Updated caption" },
    );
  });

  it("publishes a banner and supports manual activation changes", async () => {
    const banner = {
      id: 3,
      title: "Campaign",
      imageUrl,
      imageAlt: "Campaign banner",
      isActive: true,
    };
    vi.mocked(httpClient.post).mockResolvedValueOnce(banner);
    vi.mocked(httpClient.patch).mockResolvedValueOnce({
      ...banner,
      isActive: false,
    });

    await expect(
      createBanner({
        title: "Campaign",
        imageUrl,
        imageAlt: "Campaign banner",
        isActive: true,
      }),
    ).resolves.toBe(banner);
    expect(httpClient.post).toHaveBeenCalledWith(ENDPOINTS.banners, {
      title: "Campaign",
      imageUrl,
      imageAlt: "Campaign banner",
      isActive: true,
    });

    await expect(updateBannerActivation(3, false)).resolves.toMatchObject({
      isActive: false,
    });
    expect(httpClient.patch).toHaveBeenCalledWith(
      ENDPOINTS.bannerActivation(3),
      { isActive: false },
    );
  });

  it("updates an existing banner through its item endpoint", async () => {
    const banner = { id: 3, title: "Updated campaign" };
    vi.mocked(httpClient.patch).mockResolvedValueOnce(banner);

    await expect(
      updateBanner(3, { title: "Updated campaign" }),
    ).resolves.toBe(banner);
    expect(httpClient.patch).toHaveBeenCalledWith(ENDPOINTS.banner(3), {
      title: "Updated campaign",
    });
  });
});
