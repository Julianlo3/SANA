import {
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { describe, expect, it, vi } from 'vitest';
import { ConsultantsController } from '../../src/consultants/consultants.controller.js';
import { ContentCardsController } from '../../src/content/content-cards.controller.js';
import { ContentItemsController } from '../../src/content/content-items.controller.js';
import { BannersController } from '../../src/content/banners/banners.controller.js';
import { GalleryImagesController } from '../../src/content/gallery/gallery-images.controller.js';
import { NewsController } from '../../src/content/news/news.controller.js';
import { RolesGuard } from '../../src/guards/roles.guard.js';
import { UserRole } from '../../src/models/user-role.enum.js';

type ControllerClass = {
  prototype: { findAll: (...args: never[]) => unknown };
};

function createContext(
  controller: ControllerClass,
  role: UserRole,
): ExecutionContext {
  const request = {
    user: { userId: 10, email: 'user@example.com', roles: [role] },
    method: 'GET',
    originalUrl: '/test',
  };

  return {
    getHandler: () => controller.prototype.findAll,
    getClass: () => controller,
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('protected consultant and content routes', () => {
  const securityLogService = {
    logRoleMismatch: vi.fn().mockResolvedValue(undefined),
  };
  const guard = new RolesGuard(new Reflector(), securityLogService as never);
  const contentControllers: ControllerClass[] = [
    ContentItemsController,
    ContentCardsController,
    NewsController,
    GalleryImagesController,
    BannersController,
  ];

  it('allows the assistant to use consultant records and denies unrelated roles', () => {
    const assistantContext = createContext(
      ConsultantsController,
      UserRole.Secretary,
    );
    const psychologistContext = createContext(
      ConsultantsController,
      UserRole.Psychologist,
    );

    expect(guard.canActivate(assistantContext)).toBe(true);
    expect(() => guard.canActivate(psychologistContext)).toThrow(
      ForbiddenException,
    );
  });

  it('allows administrator and marketing while denying assistant and psychologist in content modules', () => {
    for (const controller of contentControllers) {
      expect(
        guard.canActivate(createContext(controller, UserRole.Administrator)),
      ).toBe(true);
      expect(
        guard.canActivate(createContext(controller, UserRole.Marketing)),
      ).toBe(true);
      expect(() =>
        guard.canActivate(createContext(controller, UserRole.Secretary)),
      ).toThrow(ForbiddenException);
      expect(() =>
        guard.canActivate(createContext(controller, UserRole.Psychologist)),
      ).toThrow(ForbiddenException);
    }

    expect(securityLogService.logRoleMismatch).toHaveBeenCalled();
  });
});
