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

El flujo usa el baseline pasivo y falla ante alertas configuradas por ZAP. Para
ajustar falsos positivos, agregue un archivo de reglas ZAP versionado y páselo
al action; no se incluyen exclusiones por defecto.
