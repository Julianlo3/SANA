import { IsIn } from 'class-validator';
import { IMAGE_FOLDERS, type ImageFolder } from '../content.constants.js';

/** Validates the destination folder for a signed Cloudinary image upload. */
export class CreateImageUploadSignatureDto {
  @IsIn(IMAGE_FOLDERS, {
    message: `folder must be one of: ${IMAGE_FOLDERS.join(', ')}`,
  })
  folder!: ImageFolder;
}
