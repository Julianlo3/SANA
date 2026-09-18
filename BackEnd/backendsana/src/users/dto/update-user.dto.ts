import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsOptional,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { AssignedRoleDto } from './assigned-role.dto.js';
import { ProfessionalDataDto } from './create-user.dto.js';

const IDENTITY_DOCUMENT_PATTERN = /^\d{6,12}$/;
const PHONE_PATTERN = /^\d{7,10}$/;

/**
 * Edicion de un usuario existente (HU-1.3). El correo no es editable aqui:
 * es la cuenta de Google con la que la persona inicia sesion.
 */
export class UpdateUserDto {
  @IsOptional()
  @MaxLength(100)
  fullName?: string;

  @IsOptional()
  @Matches(IDENTITY_DOCUMENT_PATTERN, {
    message: 'identityDocument must contain between 6 and 12 digits',
  })
  identityDocument?: string;

  @IsOptional()
  @Matches(PHONE_PATTERN, {
    message: 'phone must contain between 7 and 10 digits',
  })
  phone?: string;

  @IsOptional()
  @ArrayMinSize(1, { message: 'the user must keep at least one role' })
  @ValidateNested({ each: true })
  @Type(() => AssignedRoleDto)
  roles?: AssignedRoleDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => ProfessionalDataDto)
  professionalData?: ProfessionalDataDto;
}
