import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import {
  RATE_LIMIT_KEY,
  RateLimitOptions,
} from '../middlewares/rate-limit.decorator.js';

interface RequestBucket {
  timestamps: number[];
  lastSeenAt: number;
}

/**
 * Bounded in-memory rate limiter for brute-force attacks, credential stuffing,
 * and resource exhaustion.
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly storage = new Map<string, RequestBucket>();
  private readonly cleanupInterval: NodeJS.Timeout;
  private readonly maxBuckets = 10000;

  constructor(private readonly reflector: Reflector) {
    this.cleanupInterval = setInterval(() => this.cleanupStaleBuckets(), 300000);
    this.cleanupInterval.unref();
  }

  canActivate(context: ExecutionContext): boolean {
    const options = this.reflector.getAllAndOverride<RateLimitOptions>(
      RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    const limit = options?.limit ?? 100;
    const windowMs = (options?.windowSeconds ?? 60) * 1000;

    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    const clientIp = request.ip || request.socket.remoteAddress || 'unknown';
    const route = `${context.getClass().name}:${context.getHandler().name}`;
    const key = `sana:rate-limit:${route}:${clientIp}`;
    const now = Date.now();
    let bucket = this.storage.get(key);

    if (!bucket) {
      if (this.storage.size >= this.maxBuckets) this.cleanupStaleBuckets(now);
      if (this.storage.size >= this.maxBuckets) {
        throw new HttpException(
          'Too many clients are being tracked. Please try again later.',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }
      bucket = { timestamps: [], lastSeenAt: now };
      this.storage.set(key, bucket);
    }

    bucket.timestamps = bucket.timestamps.filter(
      (timestamp) => now - timestamp < windowMs,
    );
    bucket.timestamps.push(now);
    bucket.lastSeenAt = now;

    if (bucket.timestamps.length > limit) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((bucket.timestamps[0] + windowMs - now) / 1000),
      );
      response.setHeader('Retry-After', String(retryAfterSeconds));
      response.setHeader('X-RateLimit-Limit', String(limit));
      response.setHeader('X-RateLimit-Remaining', '0');

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many requests. Please slow down and try again later.',
          retryAfter: retryAfterSeconds,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    response.setHeader('X-RateLimit-Limit', String(limit));
    response.setHeader(
      'X-RateLimit-Remaining',
      String(Math.max(0, limit - bucket.timestamps.length)),
    );

    return true;
  }

  /**
   * Cleans up stale buckets.
   * @param now The current timestamp.
   */
  private cleanupStaleBuckets(now = Date.now()): void {
    for (const [key, bucket] of this.storage.entries()) {
      if (bucket.timestamps.length === 0 || now - bucket.lastSeenAt > 600000)
        this.storage.delete(key);
    }
  }
}
