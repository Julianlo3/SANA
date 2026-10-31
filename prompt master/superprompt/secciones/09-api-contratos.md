<!-- responsable: Braian, Andrés | estado: implementado parcialmente; fuente: controladores, DTOs y proxy actuales -->
# 9. Contratos de la API

## 9.1 Convenciones obligatorias

- API Nest: HTTPS/JSON, prefijo fijo `/api/v1`. Frontend: llama solo a `/api/backend/*`; el route handler lo traduce a la API e incorpora `Authorization: Bearer <Auth0 access token>` cuando hay sesión.
- No hay OpenAPI/Swagger configurado actualmente. Esta sección y DTOs son el contrato de trabajo; no afirmar que la documentación se genera sola hasta implementarlo.
- Métodos implementados: `GET`, `POST`, `PATCH`, `DELETE`. `DELETE` exitoso responde `204` sin cuerpo; creación responde `201`; lectura/actualización responde `200` salvo indicación contraria.
- Entrada `application/json`; el pipe global transforma tipos, permite solo campos declarados y rechaza campos extra. Fechas civiles: `YYYY-MM-DD`; instantes: ISO 8601 con zona.
- Rutas privadas requieren token Bearer válido y, normalmente, un `Origin` listado en `CORS_ORIGIN`. Rutas públicas con `OriginGuard` también requieren origen permitido cuando pasan por el backend; el BFF proporciona el origin esperado.
- La UI no usa IDs de actor para autorizar: el actor es el token. Los IDs de ruta identifican recursos y se validan como enteros positivos cuando aplica.

## 9.2 Respuestas y errores

Las respuestas correctas son objetos o listas específicos de cada recurso, en camelCase. No hay envoltura universal `{ data }`, ni paginación común implementada. No agregarla de forma unilateral: sería un cambio rompiente para servicios frontend.

| Estado | Significado / cuerpo esperado |
|---|---|
| `200`/`201` | Recurso, lista u objeto de resultado. |
| `204` | Operación exitosa sin cuerpo. |
| `400` | Parámetro o solicitud malformada fuera de la validación DTO. |
| `401` | Token faltante, vencido o no válido. |
| `403` | Origin no permitido, rol insuficiente o alcance del recurso denegado. |
| `404` | Recurso inexistente o no visible para el actor. |
| `409` | Conflicto de negocio, por ejemplo identidad, estado u ocupación incompatible. |
| `422` | DTO inválido. Nest retorna `statusCode`, `error` y `message`, donde `message` puede ser arreglo de errores de `class-validator`. Algunos casos específicos devuelven `{ error, message }`. |
| `429` | Límite de tasa en rutas que lo aplican. |
| `5xx` | Falla no recuperable o dependencia externa indisponible (`503` en verificación Cloudinary). |

El cliente HTTP actual convierte la lista de errores `422` en mapa `campo -> mensaje`. Por ello, conservar nombres de propiedades DTO y no exponer excepción/stack interno. Contratos nuevos deben declarar éxito, 401/403, 404, validación y conflictos de dominio.

## 9.3 Catálogo de endpoints implementados

Roles: `Público`, `JWT` (cualquier sesión válida), `ADMIN`, `SECRETARIO`, `PSICÓLOGO`, `MARKETING`, `CONSULTANTE`. Los roles exactos y reglas de alcance están en sección 3.

| Método | Ruta relativa a `/api/v1` | Rol | Contrato resumido |
|---|---|---|---|
| GET | `/`, `/healthz` | Público | Información/estado del servicio. |
| GET | `/auth/me` | JWT | Identidad autenticada: IDs, email y roles. |
| GET | `/auth/google?setup_key=...` | Secreto temporal | Inicia la autorización única de Gmail y devuelve `authorizationUrl`. No es el inicio de sesión Auth0 ni una ruta para frontend. Rate limit: 5/5 min. |
| GET | `/auth/google/callback?code=...&state=...` | Estado OAuth firmado | Google redirige aquí; intercambia el código de un solo uso y responde temporalmente `{ refreshToken }` con `Cache-Control: no-store`. Rate limit: 10/5 min. |
| PATCH | `/auth/terms`, `/auth/psychologist-terms` | JWT | Registra aceptación; retorna mensaje y bandera. El segundo no restringe rol en controlador: hallazgo a corregir, no permiso de producto. |
| DELETE | `/auth/sessions/current` | JWT | Logout lógico; `204`. La sesión Auth0 sigue siendo propiedad de Auth0. |
| GET/PATCH | `/users/me` | Roles internos o consultante | Perfil propio; PATCH permite solo campos de `UpdateOwnProfileDto`. |
| POST/GET | `/users` | ADMIN | Crea usuario / lista con `status` y `search` opcionales; no hay paginación. |
| GET/PATCH/DELETE | `/users/:id` | ADMIN | Consulta, edición o eliminación de usuario. |
| PATCH | `/users/:id/status` | ADMIN | `{ status: active|inactive|blocked, reason? }`. |
| POST | `/appointments/request` | Público o JWT opcional | Solicitud propia/dependiente; rate limit 10/minuto. Ver contrato detallado abajo. |
| GET | `/appointments` | SECRETARIO | Lista; query opcional `state`. |
| GET | `/appointments/psychologists`, `/appointments/:id`, `/:id/psychologist-history` | SECRETARIO | Selector de psicólogos, detalle y historial de asignación por paciente. |
| PATCH | `/appointments/:id/confirm`, `/:id/assign`, `/:id/discard`, `/:id/status` | SECRETARIO | Confirmar/asignar/descartar/cancelar según DTO y transición válida. |
| GET/PATCH | `/appointments/my-requests`, `/:id/cancel` | CONSULTANTE | Solicitudes propias y retiro/cancelación propia. |
| GET | `/appointments/relationships` | PSICÓLOGO | Catálogo de parentescos; el rol implementado es psicólogo. |
| GET/PATCH | `/appointments/my-appointments`, `/my-appointments/:id`, `/:id/complete` | PSICÓLOGO | Citas asignadas, detalle propio y marcar realizada. |
| GET/POST/DELETE | `/schedule/me/blocks`, `/schedule/me/blocks/:id` | PSICÓLOGO | Bloque puntual propio. |
| GET/POST/DELETE | `/schedule/me/recurring-blocks`, `/schedule/me/recurring-blocks/:id` | PSICÓLOGO | Bloque recurrente propio. |
| POST/GET | `/schedule/me/accept-terms`, `/schedule/me/terms-status` | PSICÓLOGO | Aceptación y consulta de términos de agenda. |
| GET | `/schedule/psychologists/:id/blocks`, `/psychologists/:id/calendar`, `/availability` | SECRETARIO | Bloques, calendario y slots; `availability` recibe DTO de query. |
| GET/POST/PATCH | `/consultants`, `/consultants/:id` | SECRETARIO | Listar, crear, ver/editar ficha administrativa. |
| GET | `/consultants/mine`, `/consultants/:id/full` | PSICÓLOGO | Solo consultantes propios y ficha completa autorizada. |
| POST/GET | `/clinical-notes/register-attention`, `/appointment/:appId`, `/consultant/:requesterId/history`, `/:cnId`, `/:cnId/audit` | PSICÓLOGO | Registrar/consultar notas únicamente sobre relación asignada. |
| GET | `/policy/:type` | Público | Documento de política vigente por tipo. |
| GET/PATCH | `/content-items` | ADMIN o MARKETING | Valores institucionales únicos. |
| GET/POST/PATCH/DELETE | `/content-cards`, `/:id` | ADMIN o MARKETING | Tarjetas; query `section` opcional al listar. |
| GET/POST/PATCH/DELETE | `/news`, `/:id` | ADMIN o MARKETING | Administración de noticias. |
| PATCH | `/news/:id/status`, `/news/:id/pin` | ADMIN o MARKETING | Estado y fijación de noticia. |
| GET/POST/PATCH/DELETE | `/banners`, `/:id` | ADMIN o MARKETING | Banners. |
| PATCH | `/banners/:id/activation` | ADMIN o MARKETING | `{ isActive: boolean }`. |
| GET/POST/PATCH/DELETE | `/gallery-images`, `/:id` | ADMIN o MARKETING | Galería. |
| PATCH | `/gallery-images/:id/status` | ADMIN o MARKETING | Estado de galería. |
| POST | `/image-upload-signatures` | ADMIN o MARKETING | Firma temporal para carga a Cloudinary. |
| GET | `/security-logs` | ADMIN | Eventos de rechazo con filtros de usuario/fecha. |
| GET | `/public/content`, `/public/news`, `/public/news/:id`, `/public/banners`, `/public/gallery-images` | Público | Solo proyección publicable/activa; rate limit en controladores públicos. |

El orden de rutas dinámicas importa al modificar controladores: declarar rutas específicas antes de `:id` para evitar que Nest las interprete como parámetro.

## 9.4 Payloads de alto impacto

### Solicitud pública de cita

`POST /appointments/request` recibe:

```json
{
  "requesterName": "Nombre completo",
  "requesterCardType": "CC",
  "requesterIdentityDocument": "12345678",
  "requesterContactNumber": "3001234567",
  "requesterEmail": "persona@correo.com",
  "requesterTermsAccepted": true,
  "patientType": "self",
  "appType": "presencial",
  "appReason": "Texto opcional hasta 1000 caracteres",
  "residenceZone": "Zona opcional"
}
```

Documento: 6–12 dígitos; teléfono: 7–12; correo máximo 100. `requesterBirthdate`/`requesterGender` son opcionales. Para `patientType: "dependent"`, añadir datos del dependiente (nombre, documento, fecha de nacimiento, género, contacto, `relationshipId`, aceptación). El servicio, no el cliente, valida que la combinación sea coherente y asocia una sesión opcional de forma segura. `appDateIdeal` existe solo por compatibilidad temporal: no usarlo en desarrollos nuevos.

### Asignación y atención

| Endpoint | Body |
|---|---|
| `PATCH /appointments/:id/confirm` | `{ "psyId": number, "appDate": "ISO-8601", "appDuration": number }` |
| `PATCH /appointments/:id/assign` | Igual al anterior, más `reassignmentReason?` hasta 255 caracteres. |
| `PATCH /appointments/:id/discard` | `{ "reason": "texto no vacío, máximo 500" }` |
| `PATCH /appointments/:id/status` | `{ "state": "cancelada" }` únicamente. |
| `POST /clinical-notes/register-attention` | `{ "appId": number, "observation?": "máximo 5000", "termsAccepted": boolean }` |

La fecha, duración, conflicto de agenda, estado previo y pertenencia al psicólogo se validan en backend. Un `200` no es autorización para leer una nota de otro paciente: las consultas también verifican alcance.

### Contenido e imágenes

- `PATCH /content-items`: `{ "items": [{ "key": "mission|vision", "value": "texto" }] }`.
- Tarjetas: `section` (`values|team|services|programs`), `title`, opcionales `subtitle`, `description`, `imageUrl`, `imageAlt`, `order`, `isActive`. La sección no cambia en PATCH; `null` borra opcionales donde el DTO lo permite.
- Noticias, galería y banners aceptan URL únicamente tras carga firmada; una URL de imagen debe ser Cloudinary del folder del proyecto. Una imagen requiere `imageAlt`.
- `POST /image-upload-signatures` entrega `cloudName`, `apiKey`, `timestamp`, `signature`, `folder`, formatos y bytes máximos. El cliente carga directo a Cloudinary y envía al recurso únicamente la URL segura resultante; jamás el secreto.

## 9.5 Compatibilidad y cambios

- Agregar campos de respuesta opcionales suele ser compatible; renombrar/eliminar campos, cambiar estado HTTP, rol, enum o envoltura de lista es rompiente.
- Versionar una ruptura mediante `/api/v2` o estrategia aprobada; no mutar silenciosamente `/api/v1`.
- Actualizar DTO, servicio frontend, tipos, pruebas de controlador/e2e y sección 3 cuando cambie autorización; actualizar sección 6 cuando cambie persistencia.
- Endpoints de donaciones/reportes, login OAuth de API y webhooks de Wompi **no existen aún**. No documentarlos como endpoints disponibles.
