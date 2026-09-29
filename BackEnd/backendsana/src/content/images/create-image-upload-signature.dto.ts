import { IsIn } from 'class-validator';
import { IMAGE_FOLDERS, type ImageFolder } from '../content.constants.js';

export class CreateImageUploadSignatureDto {
  @IsIn(IMAGE_FOLDERS, {
    message: `folder must be one of: ${IMAGE_FOLDERS.join(', ')}`,
  })
  folder!: ImageFolder;
}
