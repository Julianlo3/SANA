import Joi from 'joi';
import type { TypeOrmModuleOptions } from '@nestjs/typeorm';

/**
 * Creates the TypeORM module options for the application.
 * @returns The TypeORM module options.
 */
export const appConfig = (): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT),
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  ssl:
    process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  autoLoadEntities: true,
  synchronize: false,
});

/**
 * Validates the environment variables.
 * @param environment The environment variables to validate.
 * @returns The validated environment variables.
 */
export function validateEnvironment(environment: Record<string, unknown>) {
  const schema = Joi.object({
    PORT: Joi.number().port().default(3000),
    CORS_ORIGIN: Joi.string().required(),
    DATABASE_HOST: Joi.string().required(),
    DATABASE_PORT: Joi.number().port().required(),
    DATABASE_USERNAME: Joi.string().required(),
    DATABASE_PASSWORD: Joi.string().required(),
    DATABASE_NAME: Joi.string().required(),
    DATABASE_SSL: Joi.boolean().default(false),
    GOOGLE_CLIENT_ID: Joi.string().required(),
    JWT_ACCESS_SECRET: Joi.string().min(32).required(),
    JWT_REFRESH_SECRET: Joi.string().min(32).required(),
    JWT_ACCESS_TTL: Joi.string().default('15m'),
    JWT_REFRESH_TTL: Joi.string().default('7d'),
    SESSION_IDLE_TTL_MINUTES: Joi.number().integer().positive().default(30),
    COOKIE_SECURE: Joi.boolean().default(false),
    COOKIE_SAME_SITE: Joi.string()
      .valid('lax', 'strict', 'none')
      .default('lax'),
  }).unknown(true);
  const { error, value } = schema.validate(environment, { abortEarly: false });
  if (error) throw new Error(`Environment validation error: ${error.message}`);
  if (value.COOKIE_SAME_SITE === 'none' && !value.COOKIE_SECURE)
    throw new Error('COOKIE_SECURE must be true when COOKIE_SAME_SITE is none');
  return value;
}
