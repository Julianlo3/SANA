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
    AUTH0_DOMAIN: Joi.string().hostname().required(),
    AUTH0_AUDIENCE: Joi.string().uri().required(),
    AUTH0_CLAIM_NAMESPACE: Joi.string().uri().required(),
    TRUST_PROXY_HOPS: Joi.number().integer().min(0).default(0),
    POLICY_VERSION: Joi.string().trim().max(50).default('privacy-policy-2026-01'),
  }).unknown(true);
  const { error, value } = schema.validate(environment, { abortEarly: false });
  if (error) throw new Error(`Environment validation error: ${error.message}`);
  return value;
}
