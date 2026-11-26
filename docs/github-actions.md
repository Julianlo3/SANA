# Automatización de calidad, seguridad y documentación

Cada pull request hacia `main` ejecuta flujos independientes. Los archivos HTML
se descargan desde **Actions → ejecución → Artifacts**.

| Flujo | Propósito | Reporte |
| --- | --- | --- |
| `Backend CI` | Lint, tipos, pruebas y compilación del backend | `backend-coverage-html` |
| `Frontend CI` | Lint, tipos, pruebas y compilación del frontend | `frontend-coverage-html` |
| `Security` | Revisión de cambios de dependencias, `npm audit` y CodeQL | `*-dependency-audit-html`; alertas CodeQL en **Security → Code scanning** |
| `Code documentation` | Referencia HTML del código TypeScript del backend | `backend-typedoc-html` |
| `API documentation` | Contrato OpenAPI, validación y referencia HTML interactiva | `openapi-html-documentation` |
| `OWASP ZAP DAST` | Análisis dinámico pasivo del entorno de staging | `owasp-zap-reports` |
| `Postman E2E Tests` | Batería E2E de Postman/Newman contra PostgreSQL 18 efímero | `postman-e2e-reports` |

## Documentación de la API

El backend expone el comando local `npm run openapi:generate`, que construye el
contrato desde los controladores NestJS sin iniciar un servidor ni conectarse a
PostgreSQL. El flujo genera `openapi.json`, lo valida con Redocly y crea una
interfaz HTML navegable. Descarga el artefacto `openapi-html-documentation` de
la ejecución para visualizarlo localmente: no se publica en GitHub Pages ni en
ningún servicio externo.

## OWASP ZAP

ZAP debe ejecutarse contra un entorno de *staging* aislado, nunca producción.
Antes de abrir un PR, crea la variable de repositorio `ZAP_TARGET_URL` con la
URL HTTPS de ese entorno (`Settings → Secrets and variables → Actions →
Variables`). También se puede indicar una URL temporal al lanzar manualmente el
workflow. Sin una de esas dos opciones, el job se omite para evitar que un
workflow escanee por error producción o una URL no autorizada.

El flujo usa el baseline pasivo y conserva los reportes HTML, JSON y Markdown
para revisión. Tras clasificar los hallazgos, agregue un archivo de reglas ZAP
versionado para convertir las reglas relevantes en bloqueantes; no se incluyen
exclusiones por defecto.

## Postman E2E Tests

El workflow `.github/workflows/postman-tests.yml` levanta un contenedor efímero
de **PostgreSQL 18** (`postgres:18-alpine`), inicializa el esquema
`DataBase/init-scripts/01-schema-neon-new.sql` y la semilla sintética
`DataBase/seeds/seed-test-battery.sql`, inicia el backend compilado de NestJS
con integraciones externas deshabilitadas (`ENABLE_EMAIL=false`,
`ENABLE_GOOGLE_CALENDAR=false`, `ENABLE_WHATSAPP=false`) y ejecuta la colección
completa de Postman con **Newman**. De esta manera nunca se modifica la base de
datos real/Neon.

Configura estos 6 secretos del tenant de Auth0 de pruebas en
`Settings → Secrets and variables → Actions`:

- `POSTMAN_AUTH0_DOMAIN` (sin `https://`)
- `POSTMAN_AUTH0_AUDIENCE`
- `POSTMAN_AUTH0_CLAIM_NAMESPACE`
- `POSTMAN_AUTH0_CLIENT_ID`
- `POSTMAN_AUTH0_CLIENT_SECRET`
- `POSTMAN_TEST_USERS_PASSWORD`

Al finalizar, el workflow publica un resumen en la pestaña **Summary** de la
ejecución y sube el artefacto `postman-e2e-reports` con el reporte visual HTML
(`postman-report.html`, sin cabeceras ni cuerpos sensibles), `postman-summary.md`
y `postman-summary.json`. Si falta algún secreto en un PR, el job se omite sin
bloquearlo.
