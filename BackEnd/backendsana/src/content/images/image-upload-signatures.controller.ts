import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard.js';
import { OriginGuard } from '../../guards/origin.guard.js';
import { RolesGuard } from '../../guards/roles.guard.js';
import { Roles } from '../../middlewares/roles.decorator.js';
import { Section } from '../../middlewares/section.decorator.js';
import { UserRole } from '../../models/user-role.enum.js';
import { CloudinaryService } from './cloudinary.service.js';
import { CreateImageUploadSignatureDto } from './create-image-upload-signature.dto.js';

/**
 * Issues signatures so the admin panel can upload images directly to Cloudinary.
 */
@Controller('image-upload-signatures')
@UseGuards(OriginGuard, JwtAuthGuard, RolesGuard)
@Roles(UserRole.Administrator, UserRole.Marketing)
@Section('Content Management')
export class ImageUploadSignaturesController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  /**
   * Creates an upload signature for the given folder.
   * @param dto The target folder.
   * @returns The signed upload parameters.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateImageUploadSignatureDto) {
    return this.cloudinaryService.createUploadSignature(dto.folder);
  }
}
