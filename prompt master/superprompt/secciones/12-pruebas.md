<!-- responsable: Julián | estado: borrador -->
# 12. Pruebas y aseguramiento de calidad

## 12.1 Estrategia

| Nivel | Alcance | Herramienta |
|---|---|---|
| Unitarias (frontend) | Validadores puros de formularios y reglas de negocio | Vitest |
| Seguridad estática (frontend) | Verificaciones acotadas de guards, cliente HTTP, configuración y uso de HTML | Vitest + lectura de archivos TypeScript |
| Unitarias (backend) | Servicios, controladores, repositorios, guards, DTO y configuración | Vitest + `@nestjs/testing` |
| Seguridad (backend) | Controles organizados por categorías OWASP A01–A10 | Vitest |
| Integración / e2e (backend) | Rutas raíz, health check y usuarios | Vitest + Supertest; alcance de escenarios Gherkin [PENDIENTE] |
| Aceptación / e2e (frontend) | Escenarios Gherkin de la sección 7 | [PENDIENTE] |

El repositorio contiene suites en frontend y backend. Las pruebas del frontend están en `FrontEnd/sana/test/`; las del backend, en `BackEnd/backendsana/test/`. El prompt DEBE conservar la distinción entre validaciones unitarias, inspecciones estáticas, pruebas unitarias de backend y pruebas e2e al informar cobertura; no debe presentar estas suites como cobertura completa de todos los escenarios Gherkin.

### 12.1.1 Suite de seguridad existente del frontend

El prompt DEBE crear y mantener estos archivos y los siguientes casos:

| Archivo | Casos que se deben cubrir |
|---|---|
| `FrontEnd/sana/test/owasp/frontend-owasp.spec.ts` | **Control de acceso (A01):** comprobar que el guard gestiona sesión/token ausentes, respuestas 401/403 y validadores por rol (`requireAdministrator`, `requireAnyRole`). **Fallos criptográficos (A02):** comprobar que el cliente HTTP no contiene credenciales estáticas y envía cookies con `credentials: "include"`. **Inyección/XSS (A03):** recorrer `src` y rechazar usos de `dangerouslySetInnerHTML` sin Markdown seguro o sanitización. **Diseño inseguro (A04):** verificar el uso de `ApiError` y mensajes por estado HTTP. **Configuración (A05):** comprobar que Next.js no desactiva validaciones de lint/build ni habilita SVG peligroso sin justificación. **Autenticación (A07):** comprobar la ruta de Auth0 y su integración con `@auth0/nextjs-auth0` cuando corresponda al alcance. **Registro y monitoreo (A09):** comprobar que los fallos de red se capturan y producen un mensaje genérico seguro en español. |
| `FrontEnd/sana/test/owasp/usuarios/user-validation.spec.ts` | Para creación/edición de usuarios: rechazar etiquetas HTML/XSS y cadenas de inyección SQL en nombres; permitir solo dígitos en documento y teléfono; limitar el nombre a 100 caracteres y el documento a 6–10 dígitos; exigir exactamente 10 dígitos para el teléfono; rechazar correos mal formados y dominios no admitidos para inicio de sesión con Google (Hotmail, Outlook y Yahoo en los casos probados), y aceptar Gmail y dominios propios como `sana.org.co`. |
| `FrontEnd/sana/test/owasp/solicitar-cita/consultation-request.spec.ts` | Para la solicitud pública de cita: rechazar HTML/XSS e intentos de inyección en nombre, documento y teléfono; limitar el nombre a 100 caracteres, el documento a 6–12 dígitos, el teléfono a 7–12 dígitos y el motivo a 1000 caracteres; rechazar correos sin formato válido. |

Estas pruebas invocan directamente las funciones de validación y, en el archivo general, inspeccionan el contenido de archivos del frontend; no envían peticiones a servicios reales ni usan datos reales de consultantes. Para entradas inválidas, el validador devuelve un mensaje de error en español (`string`); para entradas válidas devuelve `undefined`. Los casos deben cubrir entradas válidas e inválidas y los límites exactos (límite permitido y primer valor fuera del límite), además de los payloads maliciosos representativos indicados arriba.

Las verificaciones estáticas del frontend son una línea base acotada y sensible a cambios de implementación; no sustituyen pruebas de comportamiento. La suite OWASP del frontend no contiene casos para A06, A08 ni A10; que el backend tenga archivos con esos nombres tampoco demuestra cobertura exhaustiva. Las comprobaciones de artefactos requeridos no deben omitirse silenciosamente cuando un archivo no exista: el test debe fallar o la ausencia debe justificarse explícitamente como fuera del alcance aprobado.

### 12.1.2 Pruebas existentes del backend

El prompt DEBE crear y mantener las suites existentes en `BackEnd/backendsana/test/` y agregar casos cuando cambien o se implementen los comportamientos correspondientes:

| Área / archivos | Alcance comprobado |
|---|---|
| `app.controller.spec.ts`; `appointments/appointments.service.spec.ts`; `clinical-notes/clinical-notes.service.spec.ts`; `email/email.service.spec.ts`; `flow-auth0/auth.service.spec.ts`; `schedule/schedule.service.spec.ts`; `users/users.service.profile.spec.ts` | Pruebas unitarias de servicios y controladores: reglas de solicitudes y ciclo de vida de citas, notas clínicas y consultas, correo, autenticación Auth0, agenda y actualización del perfil propio. |
| `appointments/appointments.repository.spec.ts`; `clinical-notes/clinical-notes.repository.spec.ts`; `email/email.repository.spec.ts`; `flow-auth0/auth.repository.spec.ts`; `policy/policy.repository.spec.ts`; `schedule/schedule.repository.spec.ts` | Pruebas de repositorios para persistencia/consultas de citas, notas, correo, identidad, políticas y disponibilidad/agendas. Deben usarse dobles cuando el caso no requiera expresamente una base de datos de prueba; no se debe afirmar que son pruebas contra una base real sin verificar su configuración. |
| `users/users.controller.spec.ts`; `clinical-notes/clinical-notes.controller.spec.ts`; `flow-auth0/auth.controller.spec.ts`; `flow-auth0/auth.guards.spec.ts`; `flow-auth0/app.config.spec.ts`; `schedule/schedule-availability-query.dto.spec.ts` | Pruebas de controladores, guards de origen/JWT/roles, validación de configuración y DTO de consulta de disponibilidad. |
| `owasp/A01-broken-access-control.spec.ts` a `owasp/A10-ssrf.spec.ts` | Suite backend organizada por las diez categorías OWASP Top 10:2021. Debe conservarse un archivo por categoría y sus casos deben comprobar controles concretos del backend. El nombre de una categoría no demuestra por sí mismo cobertura exhaustiva de esa categoría. |
| `app.e2e-spec.ts`; `users.e2e-spec.ts` | Pruebas e2e con Nest y Supertest. La primera comprueba `GET /` y `GET /api/v1/healthz`; la segunda cubre rutas/flujo de usuarios según sus casos implementados. No equivalen a pruebas e2e de todas las HU. |

El backend usa Vitest. Los archivos `vitest.config.ts` y `vitest.config.e2e.ts` separan las suites `*.spec.ts` y `*.e2e-spec.ts`, respectivamente. Los comandos disponibles desde `BackEnd/backendsana` son `npm test` (unitarias y demás `*.spec.ts`), `npm run test:cov` (con cobertura) y `npm run test:e2e` (solo `*.e2e-spec.ts`). Las dependencias incluyen `@nestjs/testing` y Supertest. El prompt DEBE mantener esos comandos/configuraciones y asegurar que las pruebas no requieran servicios externos reales en CI.

Las pruebas e2e de usuarios deben revisarse junto con su configuración para identificar dependencias de base de datos o configuración externa antes de afirmar que son autónomas o aptas para CI. La matriz de escenarios Gherkin de la sección 7 sigue pendiente: cada escenario debe vincularse a una prueba por identificador, sin contar una prueba genérica de health check como aceptación de una HU.

### 12.1.3 Ejecución

- Vitest está declarado como dependencia de desarrollo (`FrontEnd/sana/package.json`). La ejecución actual desde `FrontEnd/sana` es `npx vitest run test/owasp`.
- El manifiesto actual no declara un script `test`; el prompt DEBE agregar `"test": "vitest run"` a los scripts del frontend para permitir ejecución repetible con `npm test`.
- Las pruebas no requieren base de datos, credenciales ni servicios externos. La suite debe poder ejecutarse en CI sin acceder a ellos.
- Desde `BackEnd/backendsana`, ejecutar `npm test` para `*.spec.ts`, `npm run test:cov` para cobertura y `npm run test:e2e` para `*.e2e-spec.ts`. La suite e2e debe ejecutarse únicamente con la configuración de prueba documentada; no debe apuntar a datos de producción.

## 12.2 Reglas

- QA-01. Cada escenario de la sección 7 tiene al menos una prueba cuyo nombre incluye el identificador, p. ej. `HU-1.1 E3 cuenta bloqueada o desactivada`.
- QA-02. Cobertura mínima: [PENDIENTE]. No se debe inventar un porcentaje ni declarar cobertura de una HU por tener únicamente una prueba estática o de validación no vinculada a sus escenarios Gherkin.
- QA-03. Las integraciones externas se prueban con dobles; no se llaman servicios reales en CI.
- QA-04. Cada test debe ser determinista, independiente y usar únicamente datos ficticios; los nombres de test y mensajes esperados de la interfaz deben estar en español.
- QA-05. Las pruebas de validación deben comprobar tanto el rechazo (mensaje no vacío) como la aceptación (`undefined`) y los límites de longitud/formato definidos para cada formulario. No basta con comprobar que la función existe.
- QA-06. Las pruebas de seguridad estática deben limitar el análisis a archivos fuente pertinentes, informar claramente qué control verifican y no presentarse como prueba de seguridad integral.
- QA-07. El comando de pruebas debe ejecutarse en CI junto con lint y build; cualquier fallo debe hacer fallar el pipeline.

## 12.3 Integración y despliegue continuos

- CI en GitHub Actions: lint, pruebas y build en cada Pull Request.
- Frontend: despliegue en Vercel. Backend: despliegue en Render.
- [PENDIENTE: extender el pipeline actual (solo frontend) al backend.]
