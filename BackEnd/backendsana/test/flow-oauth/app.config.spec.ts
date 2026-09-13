import { describe, expect, it } from 'vitest';
import { validateEnvironment } from '../../src/config/app.config.js';

const environment = {
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? 'https://app.example',
  DATABASE_HOST: process.env.DATABASE_HOST ?? 'localhost',
  DATABASE_PORT: process.env.DATABASE_PORT ?? '5432',
  DATABASE_USERNAME: process.env.DATABASE_USERNAME ?? 'postgres',
  DATABASE_PASSWORD: process.env.DATABASE_PASSWORD ?? 'password',
  DATABASE_NAME: process.env.DATABASE_NAME ?? 'sana',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? 'test-client-id',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET ?? 'a'.repeat(32),
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ?? 'b'.repeat(32),
};

describe('validateEnvironment', () => {
  // Comprueba que la app completa los valores opcionales cuando el .env no los define.
  it('applies secure defaults to a valid environment', () => {
    expect(validateEnvironment(environment)).toMatchObject({
      PORT: 3000,
      DATABASE_SSL: false,
      COOKIE_SECURE: false,
      COOKIE_SAME_SITE: 'lax',
      JWT_ACCESS_TTL: '15m',
    });
  });

  // Impide enviar cookies cross-site sin el atributo Secure.
  it('rejects SameSite=None without secure cookies', () => {
    expect(() =>
      validateEnvironment({
        ...environment,
        COOKIE_SAME_SITE: 'none',
        COOKIE_SECURE: false,
      }),
    ).toThrow('COOKIE_SECURE must be true');
  });

  // Falla antes de iniciar la app si falta un secreto JWT válido.
  it('reports invalid required configuration', () => {
    expect(() =>
      validateEnvironment({ ...environment, JWT_ACCESS_SECRET: 'short' }),
    ).toThrow('Environment validation error');
  });
});
