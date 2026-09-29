import {
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../interfaces/auth.interface.js';
import type { ContentCardSection } from './content.constants.js';
import { CloudinaryService } from './images/cloudinary.service.js';
import {
  ContentRepository,
  type ContentCardPatch,
} from './content.repository.js';
import type { ContentCardsQueryDto } from './dto/content-cards-query.dto.js';
import type {
  ContentCardResponse,
  ContentItemResponse,
  PublicContentCard,
  PublicContentResponse,
} from './dto/content-response.dto.js';
import type { CreateContentCardDto } from './dto/create-content-card.dto.js';
import type { UpdateContentCardDto } from './dto/update-content-card.dto.js';
import type { UpdateContentItemsDto } from './dto/update-content-items.dto.js';

type CardFields = Pick<
  ContentCardResponse,
  'title' | 'subtitle' | 'description' | 'imageUrl' | 'imageAlt'
>;

const REQUIRED_BY_SECTION: Record<ContentCardSection, (keyof CardFields)[]> = {
  values: ['title'],
  team: ['title', 'subtitle', 'imageUrl'],
  services: ['title', 'description'],
  programs: ['title', 'description'],
};

const FIELD_LABELS: Record<ContentCardSection, Partial<Record<keyof CardFields, string>>> = {
  values: { title: 'nombre del valor' },
  team: { title: 'nombre', subtitle: 'cargo', imageUrl: 'foto' },
  services: { title: 'nombre del servicio', description: 'descripción' },
  programs: { title: 'nombre del programa', description: 'descripción' },
};

/**
 * Service with the business rules for institutional content (HU-4.1).
 */
@Injectable()
export class ContentService {
  private readonly logger = new Logger(ContentService.name);

  constructor(
    private readonly repository: ContentRepository,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  /**
   * Finds the single-value items (mission and vision) with their last editor.
   * @returns A promise that resolves to the content items.
   */
  findItems(): Promise<ContentItemResponse[]> {
    return this.repository.findItems();
  }

  /**
   * Saves the given single-value items.
   * @param user The authenticated user making the change.
   * @param dto The items to save.
   * @returns A promise that resolves to the updated content items.
   */
  async saveItems(
    user: AuthenticatedUser,
    dto: UpdateContentItemsDto,
  ): Promise<ContentItemResponse[]> {
    await this.repository.saveItems(dto.items, user.userId);
    this.logger.log(
      `Module:content, Function:saveItems, result-success: userId-${user.userId}, keys-${dto.items.map((item) => item.key).join('|')}`,
    );
    return this.repository.findItems();
  }

  /**
   * Finds the content cards for the admin panel.
   * @param query Optional section filter.
   * @returns A promise that resolves to the content cards.
   */
  findCards(query: ContentCardsQueryDto): Promise<ContentCardResponse[]> {
    return this.repository.findCards(query.section);
  }

  /**
   * Creates a content card after checking the required fields of its section.
   * @param user The authenticated user creating the card.
   * @param dto The card data.
   * @returns A promise that resolves to the created card.
   */
  async createCard(
    user: AuthenticatedUser,
    dto: CreateContentCardDto,
  ): Promise<ContentCardResponse> {
    const fields: CardFields = {
      title: dto.title,
      subtitle: emptyToNull(dto.subtitle),
      description: emptyToNull(dto.description),
      imageUrl: dto.imageUrl ?? null,
      imageAlt: emptyToNull(dto.imageAlt),
    };
    this.ensureRequiredFields(dto.section, fields);
    if (fields.imageUrl) {
      await this.cloudinaryService.ensureValidImage(fields.imageUrl, 'content');
    }

    const card = await this.repository.createCard(
      {
        section: dto.section,
        ...fields,
        order: dto.order ?? null,
        isActive: dto.isActive ?? true,
      },
      user.userId,
    );
    this.logger.log(
      `Module:content, Function:createCard, result-success: userId-${user.userId}, cardId-${card.id}, section-${card.section}`,
    );
    return card;
  }

  /**
   * Updates a content card; the merged result must still meet its section rules.
   * @param user The authenticated user making the change.
   * @param id The ID of the card.
   * @param dto The fields to change.
   * @returns A promise that resolves to the updated card.
   */
  async updateCard(
    user: AuthenticatedUser,
    id: number,
    dto: UpdateContentCardDto,
  ): Promise<ContentCardResponse> {
    const current = await this.repository.findCardById(id);
    if (!current) throw new NotFoundException('El elemento de contenido no existe');

    const patch: ContentCardPatch = {
      title: dto.title,
      subtitle: dto.subtitle === undefined ? undefined : emptyToNull(dto.subtitle),
      description:
        dto.description === undefined ? undefined : emptyToNull(dto.description),
      imageUrl: dto.imageUrl,
      imageAlt: dto.imageAlt === undefined ? undefined : emptyToNull(dto.imageAlt),
      order: dto.order,
      isActive: dto.isActive,
    };
    if (patch.imageUrl === null) patch.imageAlt = null;

    this.ensureRequiredFields(current.section, {
      title: patch.title ?? current.title,
      subtitle: patch.subtitle === undefined ? current.subtitle : patch.subtitle,
      description:
        patch.description === undefined ? current.description : patch.description,
      imageUrl: patch.imageUrl === undefined ? current.imageUrl : patch.imageUrl,
      imageAlt: patch.imageAlt === undefined ? current.imageAlt : patch.imageAlt,
    });
    if (patch.imageUrl && patch.imageUrl !== current.imageUrl) {
      await this.cloudinaryService.ensureValidImage(patch.imageUrl, 'content');
    }

    const card = await this.repository.updateCard(id, patch, user.userId);
    if (!card) throw new NotFoundException('El elemento de contenido no existe');
    if (current.imageUrl && patch.imageUrl !== undefined && patch.imageUrl !== current.imageUrl) {
      await this.cloudinaryService.deleteImage(current.imageUrl);
    }

    this.logger.log(
      `Module:content, Function:updateCard, result-success: userId-${user.userId}, cardId-${id}`,
    );
    return card;
  }

  /**
   * Deletes a content card.
   * @param user The authenticated user deleting the card.
   * @param id The ID of the card.
   */
  async deleteCard(user: AuthenticatedUser, id: number): Promise<void> {
    const current = await this.repository.findCardById(id);
    const wasDeleted = current && (await this.repository.deleteCard(id, user.userId));
    if (!wasDeleted) throw new NotFoundException('El elemento de contenido no existe');
    if (current.imageUrl) await this.cloudinaryService.deleteImage(current.imageUrl);

    this.logger.log(
      `Module:content, Function:deleteCard, result-success: userId-${user.userId}, cardId-${id}`,
    );
  }

  /**
   * Builds the institutional content shown to public visitors.
   * @returns A promise that resolves to the published content grouped by section.
   */
  async findPublicContent(): Promise<PublicContentResponse> {
    const [items, cards] = await Promise.all([
      this.repository.findItems(),
      this.repository.findActiveCards(),
    ]);

    const bySection = (section: ContentCardSection): PublicContentCard[] =>
      cards
        .filter((card) => card.section === section)
        .map(({ id, title, subtitle, description, imageUrl, imageAlt }) => ({
          id,
          title,
          subtitle,
          description,
          imageUrl,
          imageAlt,
        }));

    return {
      mission: items.find((item) => item.key === 'about.mission')?.value ?? null,
      vision: items.find((item) => item.key === 'about.vision')?.value ?? null,
      values: bySection('values'),
      team: bySection('team'),
      services: bySection('services'),
      programs: bySection('programs'),
    };
  }

  private ensureRequiredFields(section: ContentCardSection, fields: CardFields): void {
    const missing = REQUIRED_BY_SECTION[section].filter((field) => !fields[field]);
    if (fields.imageUrl && !fields.imageAlt) missing.push('imageAlt');

    if (missing.length > 0) {
      const labels = missing.map(
        (field) =>
          FIELD_LABELS[section][field] ??
          (field === 'imageAlt' ? 'descripción de la imagen' : field),
      );
      throw new UnprocessableEntityException({
        error: 'MISSING_REQUIRED_FIELDS',
        message: `Faltan campos obligatorios: ${labels.join(', ')}`,
        fields: missing,
      });
    }
  }
}

function emptyToNull(value: string | null | undefined): string | null {
  return value ? value : null;
}
