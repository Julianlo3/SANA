<!-- responsable: Braian, Julián | estado: implementado parcialmente; fuente: package.json y configuración del repositorio -->
# 4. Stack tecnológico y convenciones

## 4.1 Fuente de verdad y alcance

Esta sección describe el stack **realmente instalado**. No inferir dependencias, infraestructura ni servicios a partir de las historias de usuario. Donaciones, reportes, WhatsApp y OAuth social directo aparecen en requisitos, pero no tienen módulo, endpoint ni pantalla implementados; son pendientes, no parte del runtime actual.

## 4.2 Tecnologías instaladas

| Capa | Tecnología y versión declarada | Uso en SANA |
|---|---|---|
| Frontend | Next.js `16.3.8`, React/React DOM `19.2.8`, TypeScript `5` | App Router, páginas y proxy BFF. |
| Estilos/UI | Tailwind CSS `4`, PostCSS, CSS global; Lucide, React Big Calendar, date-fns, react-markdown | Diseño, iconos, agenda, fechas y Markdown limitado para noticias. |
| Autenticación web | `@auth0/nextjs-auth0` `4.30.0` | Sesión Next.js y access token reenviado a la API. |
| Backend | Node.js, NestJS `12.1.x`, TypeScript `6.0.2`, Express | API REST modular; puerto `3000` por defecto. |
| Persistencia | PostgreSQL/Neon, `pg` `8.23.0`, TypeORM `1.1.1` | Entidades y esquema SQL versionado. |
| Despliegue frontend | Vercel | Aplicación Next.js desplegada. |
| Despliegue backend | Render | API NestJS desplegada. |
| Seguridad | `jose`, Helmet, cookie-parser, bcrypt, Joi, class-validator/transformer | JWT Auth0, cabeceras, ambiente y DTOs. |
| Correo | Nodemailer `10.0.13` sobre SMTP | Cola durable `email_outbox`, reintentos y limpieza de payload enviado. |
| Imágenes | Cloudinary REST API, sin SDK | Firma de carga directa y verificación previa a persistir. |
| Pruebas | Vitest, Supertest y cobertura V8 | Unitarias, e2e y OWASP. |
| Calidad | Oxlint backend; ESLint Next frontend; Prettier backend | `npm run lint`; Prettier tiene script de escritura. |

No se declara versión de Node mediante `.nvmrc`, `engines` ni `.tool-versions`. Fijarla antes de CI/producción; no asumir la versión local.

## 4.3 Topología y rutas técnicas

```text
Navegador -> Next.js en Vercel (:5173 en desarrollo)
              /api/backend/* -> route handler BFF
                                -> BACKEND_API_URL/api/v1/* + Bearer JWT + Origin
           NestJS en Render (:3000 por defecto) -> TypeORM -> PostgreSQL/Neon
                                      -> Auth0, Cloudinary, SMTP/email_outbox
```

- El backend fija `api/v1` con `app.setGlobalPrefix`; su contrato empieza por `/api/v1`, no `/api`.
- El navegador consume `/api/backend/*`, no la URL del backend. El BFF añade el access token Auth0 disponible y `Origin`; no reenvía cookies de sesión al backend.
- Los endpoints privados requieren `Authorization: Bearer <access-token>`. El backend actual no lee un JWT propio desde una cookie `httpOnly`.
- CORS y `OriginGuard` admiten solo `CORS_ORIGIN`; el BFF usa `APP_BASE_URL` o `http://localhost:5173`.

## 4.4 Estructura del repositorio

```text
BackEnd/backendsana/              # NestJS: src/<módulo>, test/, .env.example
FrontEnd/sana/                    # Next.js App Router
  src/app/                        # rutas y layouts por grupo
  src/features/<dominio>/          # páginas, hooks, servicios, tipos, validación
  src/services/api/http-client.ts  # único cliente HTTP de pantallas
  src/app/api/backend/[...path]/   # proxy hacia NestJS
DataBase/init-scripts/             # esquema base, semillas y esquema Neon evolutivo
prompt master/                    # superprompt ensamblable y workflow
```

En frontend, una capacidad vive en `features/<dominio>`; las rutas de `app` solo componen páginas/layouts. Una pantalla no llama `fetch` directamente: usa el servicio de su feature y `http-client.ts`.

## 4.5 Configuración y secretos

| Componente | Variables relevantes | Regla |
|---|---|---|
| Backend | `DATABASE_*`, `DATABASE_SSL`, `CORS_ORIGIN`, `PORT`, `TRUST_PROXY_HOPS` | Joi las valida. `synchronize: false`; SSL Neon usa `rejectUnauthorized: false` al habilitarse. |
| Auth0 | `AUTH0_DOMAIN`, `AUTH0_AUDIENCE`, `AUTH0_CLAIM_NAMESPACE`; frontend: `AUTH0_AUDIENCE` | El audience debe coincidir entre emisor, frontend y API. |
| Proxy | `BACKEND_API_URL`, `APP_BASE_URL` | `BACKEND_API_URL` ya incluye `/api/v1`; no duplicar prefijo. |
| Cloudinary | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_FOLDER` | El secreto no llega al cliente; el backend firma cargas temporales. |
| Correo | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | TLS mínimo 1.2. Sin configuración válida, el envío se desactiva de forma segura. |

Los `.env` y secretos nunca se versionan. `.env.example` contiene plantillas, no credenciales.

Vercel, Render y Neon son los despliegues activos. La ausencia de manifiestos de infraestructura como código en este repositorio no implica que el sistema no esté desplegado; las variables y dominios productivos se administran en cada proveedor.

## 4.6 Convenciones de código

- TypeScript estricto y ESM: importaciones locales backend terminan en `.js` aunque el fuente sea `.ts`.
- NestJS: módulo agrupa controlador, servicio, repositorio, DTOs y entidades. Controlador = HTTP; servicio = dominio/transacciones; repositorio = persistencia.
- DTOs con `class-validator`; `ValidationPipe` global usa `transform`, `whitelist` y `forbidNonWhitelisted`. Un campo no declarado causa `422`.
- En TypeORM/PostgreSQL, columnas enteras anulables declaran `type: 'integer'`. Mantener `synchronize: false`; cada cambio vive en SQL/migración revisable.
- El `httpClient` envía JSON y traduce errores de validación para formularios. Tipos, validación y servicios permanecen junto a la feature.
- Nombres técnicos, rutas, payloads y estados respetan los valores exactos del código; la interfaz se redacta en español. Usar `YYYY-MM-DD` para fecha civil e ISO 8601 con zona para instantes.
- No registrar tokens, contraseñas, documentos completos, notas clínicas ni cuerpos de correo.

## 4.7 Scripts verificados

| Área | Comandos |
|---|---|
| Backend | `npm run start:dev`, `npm run build`, `npm run lint`, `npm test`, `npm run test:e2e`, `npm run test:cov` |
| Frontend | `npm run dev`, `npm run build`, `npm run lint` |

Ejecutarlos desde `BackEnd/backendsana` o `FrontEnd/sana`. Ambos tienen `package-lock.json`: npm es el gestor establecido.

## 4.8 Git y entrega

- `main` recibe cambios mediante Pull Request aprobado.
- Ramas descriptivas: `feat/`, `fix/`, `docs/`, `test/`, `refactor/`, `chore/`.
- Conventional Commits en español: `feat: registrar bloqueo recurrente`.
- Un cambio de contrato, rol, tabla, estado o variable de entorno actualiza las secciones 3, 4, 6, 9 y/o 10 y sus pruebas.
