import { SetMetadata } from '@nestjs/common';

export const SECTION_KEY = 'security_section';

/**
 * Decorator that defines the logical business section or resource name for a controller or route handler.
 * Used for security access tracking and audit logging in security_access_log.
 * @param section The name or description of the section (e.g., 'Psychologist Management', 'Admin Dashboard').
 * @returns A decorator function setting the section metadata.
 */
export const Section = (section: string) => SetMetadata(SECTION_KEY, section);
