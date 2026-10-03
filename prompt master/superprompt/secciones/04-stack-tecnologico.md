<!-- responsable: Braian, Julián | estado: borrador -->
# 4. Stack tecnológico y convenciones

## 4.1 Tecnologías

| Capa | Tecnología | Versión |
|---|---|---|
| Frontend | [PENDIENTE: framework] | [PENDIENTE] |
| Backend | [PENDIENTE: confirmar NestJS], TypeScript | [PENDIENTE] |
| ORM | TypeORM | [PENDIENTE] |
| Base de datos | PostgreSQL (Neon) | [PENDIENTE] |
| Autenticación | Google OAuth 2.0; JWT en cookie httpOnly | - |
| Despliegue frontend | Vercel | - |
| Despliegue backend | Render | - |
| Correo transaccional | [PENDIENTE: Resend o SendGrid] | - |
| Pruebas | [PENDIENTE: framework de pruebas unitarias, integración y e2e] | - |
| Runtime y gestor de paquetes | [PENDIENTE: versión de Node.js; npm o pnpm] | - |

## 4.2 Restricciones técnicas conocidas

- TC-01. En TypeORM con PostgreSQL, las columnas enteras nulables DEBEN declarar `type: 'integer'` explícitamente.

## 4.3 Estructura del repositorio

[PENDIENTE: árbol de directorios (frontend/, backend/, docs/, superprompt/).]

## 4.4 Control de versiones

- Rama principal: `main`. Todo cambio ingresa por Pull Request con al menos una revisión aprobada.
- Nombres de rama descriptivos de la funcionalidad, con prefijo de tipo: `feat/crear-usuario`, `fix/login-cookie`. No usar solo el identificador de la HU.
- Mensajes de commit según Conventional Commits, en español: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`.

## 4.5 Estilo de código

[PENDIENTE: linter, formateador y configuración (p. ej. ESLint + Prettier).]
