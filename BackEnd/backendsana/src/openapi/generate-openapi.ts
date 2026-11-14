import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '../app.module.js';

// This command creates the contract without starting an HTTP server or database.
// They are placeholders solely to satisfy the application's environment validation.
Object.assign(process.env, {
  GENERATE_OPENAPI: 'true',
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  DATABASE_HOST: process.env.DATABASE_HOST ?? 'localhost',
  DATABASE_PORT: process.env.DATABASE_PORT ?? '5432',
  DATABASE_USERNAME: process.env.DATABASE_USERNAME ?? 'openapi',
  DATABASE_PASSWORD: process.env.DATABASE_PASSWORD ?? 'openapi',
  DATABASE_NAME: process.env.DATABASE_NAME ?? 'openapi',
  AUTH0_DOMAIN: process.env.AUTH0_DOMAIN ?? 'example.us.auth0.com',
  AUTH0_AUDIENCE: process.env.AUTH0_AUDIENCE ?? 'https://api.sana.example.com',
  AUTH0_CLAIM_NAMESPACE:
    process.env.AUTH0_CLAIM_NAMESPACE ?? 'https://sana.example.com',
});

try {
  console.info('[openapi] Creating the Nest application context.');
  const app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix('api/v1');

  const config = new DocumentBuilder()
    .setTitle('SANA API')
    .setDescription('Contrato HTTP generado automáticamente desde el backend SANA.')
    .setVersion(process.env.npm_package_version ?? '0.0.0')
    .addServer('https://api.sana.example.com', 'Servidor de producción (referencia)')
    .addBearerAuth()
    .build();

  console.info('[openapi] Discovering routes and generating the contract.');
  const document = SwaggerModule.createDocument(app, config, { deepScanRoutes: true });
  await mkdir('openapi', { recursive: true });
  await writeFile(
    join('openapi', 'openapi.json'),
    `${JSON.stringify(document, null, 2)}\n`,
  );
  await app.close();
  console.info('[openapi] Contract written to openapi/openapi.json.');
} catch (error) {
  console.error('[openapi] Contract generation failed.', error);
  process.exitCode = 1;
}
