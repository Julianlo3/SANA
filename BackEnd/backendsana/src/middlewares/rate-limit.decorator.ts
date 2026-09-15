import { SetMetadata } from '@nestjs/common';

export const RATE_LIMIT_KEY = 'rate_limit_options';

export interface RateLimitOptions {
  /**
   * Maximum number of allowed requests within the time window.
   */
  limit: number;
  /**
   * Time window in seconds.
   */
  windowSeconds: number;
}

/**
 * Decorator to configure rate limiting / throttling on specific controller endpoints.
 * @param options The rate limit configuration ({ limit, windowSeconds }).
 */
export const RateLimit = (options: RateLimitOptions) =>
  SetMetadata(RATE_LIMIT_KEY, options);
