import { applyDecorators } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiTags } from '@nestjs/swagger';

export function ApiControllerDocs(
  tag: string,
  requiresBearerAuth = false,
): ClassDecorator {
  const decorators: ClassDecorator[] = [
    ApiTags(tag),
    ApiBadRequestResponse({
      description: 'The request is malformed or contains an invalid parameter.',
    }),
  ];

  if (requiresBearerAuth) {
    decorators.push(ApiBearerAuth());
  }

  return applyDecorators(...decorators);
}
