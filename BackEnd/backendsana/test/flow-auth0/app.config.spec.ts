import { describe, expect, it } from 'vitest';
import { validateEnvironment } from '../../src/config/app.config.js';

const environment = {
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? 'https://app.example',
  DATABASE_HOST: process.env.DATABASE_HOST ?? 'localhost',
  DATABASE_PORT: process.env.DATABASE_PORT ?? '5432',
  DATABASE_USERNAME: process.env.DATABASE_USERNAME ?? 'postgres',
  DATABASE_PASSWORD: process.env.DATABASE_PASSWORD ?? 'password',
  DATABASE_NAME: process.env.DATABASE_NAME ?? 'sana',
  AUTH0_DOMAIN: process.env.AUTH0_DOMAIN ?? 'tenant.us.auth0.com',
  AUTH0_AUDIENCE: process.env.AUTH0_AUDIENCE ?? 'https://api.sana.example.com',
  AUTH0_CLAIM_NAMESPACE:
    process.env.AUTH0_CLAIM_NAMESPACE ?? 'https://sana.app',
};

describe('validateEnvironment', () => {
  // Comprueba que la app completa los valores opcionales cuando el .env no los define.
  it('applies secure defaults to a valid environment', () => {
    expect(validateEnvironment(environment)).toMatchObject({
      PORT: 3000,
      DATABASE_SSL: false,
      AUTH0_DOMAIN: 'tenant.us.auth0.com',
    });
  });

  it('requires the Auth0 domain', () => {
    expect(() =>
      validateEnvironment({
        ...environment,
        AUTH0_DOMAIN: undefined,
      }),
    ).toThrow('Environment validation error');
  });

  // Falla antes de iniciar la app si falta la audiencia de Auth0.
  it('reports invalid required configuration', () => {
    expect(() =>
      validateEnvironment({ ...environment, AUTH0_AUDIENCE: undefined }),
    ).toThrow('Environment validation error');
  });
});
