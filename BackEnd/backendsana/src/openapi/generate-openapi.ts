import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

type ApiResponseDescription = { description?: string; $ref?: string };
type ApiOperationDescription = {
  summary?: string;
  responses: Record<string, ApiResponseDescription>;
};

function isApiOperation(value: unknown): value is ApiOperationDescription {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('responses' in value) ||
    typeof value.responses !== 'object' ||
    value.responses === null
  ) {
    return false;
  }

  return Object.values(value.responses).every(
    (response) =>
      typeof response === 'object' &&
      response !== null &&
      (!('description' in response) ||
        typeof response.description === 'string') &&
      (!('$ref' in response) || typeof response.$ref === 'string'),
  );
}

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
  // AppModule imports ConfigModule. It must be loaded only after the temporary
  // values above exist, otherwise ConfigModule validates the empty CI env.
  const { AppModule } = await import('../app.module.js');
  console.info('[openapi] Creating the Nest application context.');
  // Prevent Nest from calling process.exit(1) before the catch block can show
  // the actual bootstrap error in CI logs.
  const app = await NestFactory.create(AppModule, {
    logger: false,
    abortOnError: false,
  });
  app.setGlobalPrefix('api/v1');

  const config = new DocumentBuilder()
    .setTitle('SANA API')
    .setDescription('HTTP API contract generated automatically from the SANA backend.')
    .setVersion(process.env.npm_package_version ?? '0.0.0')
    .addServer(
      process.env.OPENAPI_SERVER_URL ?? 'http://localhost:3000',
      process.env.OPENAPI_SERVER_URL
        ? 'Configured API server'
        : 'Local development server',
    )
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Paste the access token issued by the identity provider.',
      },
      'bearer',
    )
    .build();

  console.info('[openapi] Discovering routes and generating the contract.');
  const document = SwaggerModule.createDocument(app, config, { deepScanRoutes: true });
  document.security = [];
  for (const pathItem of Object.values(document.paths)) {
    if (!pathItem) continue;
    for (const operation of Object.values(pathItem)) {
      if (!isApiOperation(operation)) continue;
      for (const [status, response] of Object.entries(operation.responses)) {
        if (!/^2\d\d$/.test(status) || '$ref' in response || response.description) {
          continue;
        }
        response.description =
          status === '204'
            ? 'The operation succeeded and returned no content.'
            : operation.summary ?? 'Successful response.';
      }
    }
  }
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
