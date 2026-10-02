<!-- responsable: Julián | estado: borrador -->
# 12. Pruebas y aseguramiento de calidad

## 12.1 Estrategia

| Nivel | Alcance | Herramienta |
|---|---|---|
| Unitarias | Servicios, guards, utilidades | [PENDIENTE] |
| Integración | Endpoints contra base de datos de prueba | [PENDIENTE] |
| Aceptación / e2e | Escenarios Gherkin de la sección 7 | [PENDIENTE] |

## 12.2 Reglas

- QA-01. Cada escenario de la sección 7 tiene al menos una prueba cuyo nombre incluye el identificador, p. ej. `HU-1.1 E3 cuenta bloqueada o desactivada`.
- QA-02. Cobertura mínima: [PENDIENTE].
- QA-03. Las integraciones externas se prueban con dobles; no se llaman servicios reales en CI.

## 12.3 Integración y despliegue continuos

- CI en GitHub Actions: lint, pruebas y build en cada Pull Request.
- Frontend: despliegue en Vercel. Backend: despliegue en Render.
- [PENDIENTE: extender el pipeline actual (solo frontend) al backend.]
