import { createHash } from 'node:crypto';
import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IMAGE_FORMATS,
  IMAGE_MAX_BYTES,
  type ImageFolder,
} from '../content.constants.js';

export interface ImageUploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  allowedFormats: string;
  maxBytes: number;
}

interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  rootFolder: string;
}

const INVALID_IMAGE_MESSAGE = `La imagen debe ser JPG, PNG o WebP de máximo ${IMAGE_MAX_BYTES / (1024 * 1024)} MB`;

/**
 * Signs direct browser uploads to Cloudinary and verifies uploaded images before they are saved.
 */
@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Creates a short-lived signature that lets the browser upload one image to the given folder.
   * @param folder The logical folder for the image.
   * @returns The upload parameters and their signature.
   */
  createUploadSignature(folder: ImageFolder): ImageUploadSignature {
    const config = this.getConfig();
    const params = {
      allowed_formats: IMAGE_FORMATS.join(','),
      folder: `${config.rootFolder}/${folder}`,
      timestamp: Math.floor(Date.now() / 1000),
    };

    return {
      cloudName: config.cloudName,
      apiKey: config.apiKey,
      timestamp: params.timestamp,
      signature: this.sign(params, config.apiSecret),
      folder: params.folder,
      allowedFormats: params.allowed_formats,
      maxBytes: IMAGE_MAX_BYTES,
    };
  }

  /**
   * Checks that the URL points to an image of this project in the expected folder, with an allowed format and size.
   * @param imageUrl The secure URL returned by Cloudinary.
   * @param folder The folder the image must belong to.
   */
  async ensureValidImage(imageUrl: string, folder: ImageFolder): Promise<void> {
    const config = this.getConfig();
    const publicId = this.extractPublicId(imageUrl, config, folder);
    if (!publicId) throw this.invalidImage();

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${config.cloudName}/resources/image/upload/${publicId}`,
      {
        headers: { Authorization: this.basicAuth(config) },
      },
    ).catch(() => null);

    if (!response) {
      throw new ServiceUnavailableException('No se pudo verificar la imagen. Intenta de nuevo.');
    }
    if (response.status === 404) throw this.invalidImage();
    if (!response.ok) {
      this.logger.error(
        `Module:content, Function:ensureValidImage, result-error: status-${response.status}`,
      );
      throw new ServiceUnavailableException('No se pudo verificar la imagen. Intenta de nuevo.');
    }

    const resource = (await response.json()) as { bytes: number; format: string };
    const isAllowedFormat = (IMAGE_FORMATS as readonly string[]).includes(resource.format);
    if (!isAllowedFormat || resource.bytes > IMAGE_MAX_BYTES) throw this.invalidImage();
  }

  /**
   * Deletes an image of this project from Cloudinary. Failures are logged and never thrown,
   * because the record that used the image has already been removed.
   * @param imageUrl The secure URL of the image.
   */
  async deleteImage(imageUrl: string): Promise<void> {
    let config: CloudinaryConfig;
    try {
      config = this.getConfig();
    } catch {
      return;
    }

    const publicId = this.extractPublicId(imageUrl, config);
    if (!publicId) return;

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${config.cloudName}/resources/image/upload?public_ids[]=${encodeURIComponent(publicId)}`,
      { method: 'DELETE', headers: { Authorization: this.basicAuth(config) } },
    ).catch(() => null);

    if (!response?.ok) {
      this.logger.warn(
        `Module:content, Function:deleteImage, result-error: status-${response?.status ?? 'network'}, publicId-${publicId}`,
      );
      return;
    }
    this.logger.log(`Module:content, Function:deleteImage, result-success: publicId-${publicId}`);
  }

  private extractPublicId(
    imageUrl: string,
    config: CloudinaryConfig,
    folder?: ImageFolder,
  ): string | null {
    const prefix = `https://res.cloudinary.com/${config.cloudName}/image/upload/`;
    if (!imageUrl.startsWith(prefix)) return null;

    const path = imageUrl.slice(prefix.length).replace(/^v\d+\//, '');
    const match = /^([A-Za-z0-9_\-/]+)\.(jpg|png|webp)$/.exec(path);
    const expectedPrefix = folder
      ? `${config.rootFolder}/${folder}/`
      : `${config.rootFolder}/`;
    if (!match || !match[1].startsWith(expectedPrefix)) return null;

    return match[1];
  }

  private basicAuth(config: CloudinaryConfig): string {
    return `Basic ${Buffer.from(`${config.apiKey}:${config.apiSecret}`).toString('base64')}`;
  }

  private sign(params: Record<string, string | number>, apiSecret: string): string {
    const payload = Object.keys(params)
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join('&');
    return createHash('sha1').update(`${payload}${apiSecret}`).digest('hex');
  }

  private getConfig(): CloudinaryConfig {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

    if (!cloudName || !apiKey || !apiSecret) {
      this.logger.error(
        'Module:content, Function:getConfig, result-error: reason-cloudinary_not_configured',
      );
      throw new ServiceUnavailableException('La subida de imágenes no está configurada.');
    }

    return {
      cloudName,
      apiKey,
      apiSecret,
      rootFolder: this.configService.get<string>('CLOUDINARY_FOLDER') ?? 'sana',
    };
  }

  private invalidImage(): UnprocessableEntityException {
    return new UnprocessableEntityException({
      error: 'INVALID_IMAGE',
      message: INVALID_IMAGE_MESSAGE,
    });
  }
}
