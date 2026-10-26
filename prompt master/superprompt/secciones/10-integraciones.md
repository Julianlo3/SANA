<!-- responsable: equipo de desarrollo | estado: implementado parcialmente -->
# 10. Integraciones externas

## 10.1 Inventario real

| Servicio | Uso actual | Estado y límite |
|---|---|---|
| Auth0 | Autenticación web y emisión de access token; NestJS lo valida mediante JWKS/claims. | Implementado. El frontend usa `@auth0/nextjs-auth0`; el backend valida Bearer, no una cookie de aplicación. |
| Vercel | Despliegue de la aplicación web Next.js. | Implementado y activo. La configuración de proyecto/variables se administra en Vercel. |
| Render | Despliegue de la API NestJS. | Implementado y activo. La configuración de servicio/variables se administra en Render. |
| PostgreSQL en Neon | Persistencia transaccional. | Implementado mediante TypeORM/`pg`; esquema en `03-schema-NEON.sql`. |
| Cloudinary | Carga y alojamiento de imágenes institucionales. | Implementado con REST: firma backend, carga directa navegador, verificación backend. |
| Gmail API | Correo transaccional mediante OAuth2/HTTPS. | Implementado. Sin configuración completa se desactiva de forma segura. |

En un despliegue con Vercel y Render, Vercel aloja el frontend y Render aloja NestJS, incluida la integración Gmail API. Wompi, WhatsApp, Resend y SendGrid no están integrados en el código actual.

## 10.2 Auth0

**Flujo.** El usuario se autentica con Auth0 mediante el SDK de Next.js. Al invocar `/api/backend/*`, el route handler intenta obtener el access token y lo reenvía como Bearer a NestJS. `JwtAuthGuard` verifica el token y `AuthService` resuelve/sincroniza la persona y sus roles locales. La API no emite cookies JWT. Las rutas `/auth/google*` existen exclusivamente para preparar Gmail API y no participan en la autenticación de usuarios.

**Configuración mínima.** `AUTH0_DOMAIN`, `AUTH0_AUDIENCE` y `AUTH0_CLAIM_NAMESPACE` en backend; `AUTH0_AUDIENCE` en frontend, además de las variables requeridas por el SDK Auth0 de Next.js. Audience, issuer y namespace deben referirse al mismo tenant/API configurado.

**Reglas.**

- El token se trata como credencial: no loguearlo ni pasarlo a componentes cliente, URL, localStorage o errores.
- Roles y estado de cuenta se resuelven en backend; el claim no autoriza por sí solo una fila ajena.
- Probar sesión ausente, token vencido, audience/issuer incorrectos, cuenta bloqueada y rol insuficiente.
- Cerrar sesión en la capa Auth0 correspondiente; `DELETE /auth/sessions/current` no revoca mágicamente la sesión del proveedor.

## 10.3 Cloudinary

**Flujo seguro.** Un usuario ADMIN/MARKETING pide `POST /image-upload-signatures` con el folder lógico. El backend genera firma SHA-1 para `CLOUDINARY_FOLDER/<folder>`, formatos JPG/PNG/WebP y límite de bytes. El navegador carga directo a Cloudinary usando firma, timestamp y API key. Finalmente envía la `secure_url` al endpoint de contenido; NestJS comprueba cloud, folder, extensión y tamaño con Cloudinary Admin API antes de guardarla.

**Reglas.**

- `CLOUDINARY_API_SECRET` queda exclusivamente en backend; API key y firma temporal no conceden acceso administrativo.
- Persistir URLs, no binarios. Al eliminar un recurso, intentar borrar su imagen sin revertir la eliminación de BD si Cloudinary falla; registrar fallo sin URL completa si contiene datos sensibles.
- Configurar timeout de dependencia (actualmente 10 s) y devolver `503` si no se puede validar. No aceptar URLs arbitrarias ni data URLs.
- Mantener alt text y límites de formato/tamaño como parte del contrato de accesibilidad y seguridad.

## 10.4 Gmail API y outbox

El backend usa Gmail API por HTTPS y `googleapis`. Construye un mensaje MIME en base64url y usa `users.messages.send` con `userId: me`. El transporte usa OAuth2 con `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REDIRECT_URI`, `GMAIL_REFRESH_TOKEN` y `GMAIL_FROM`.

La outbox reclama lotes de hasta diez, reintenta hasta ocho veces con backoff exponencial (30 s hasta una hora), y borra destinatario/asunto/cuerpo en `sent` o `failed`. La entrega no deshace el caso de uso principal si Gmail falta o falla.

### Flujo de configuración OAuth2

1. Habilitar Gmail API y registrar en Google Auth Platform la URI exacta del callback.
2. Para desarrollo local usar `http://localhost:3000/api/v1/auth/google/callback`. Para producción usar `https://<servicio-render>/api/v1/auth/google/callback`; Vercel no recibe este callback porque el intercambio ocurre en NestJS/Render.
3. Configurar temporalmente `GMAIL_OAUTH_SETUP_SECRET`, abrir `GET /api/v1/auth/google?setup_key=<secreto>` y visitar el `authorizationUrl` devuelto.
4. Tras consentimiento con scope `https://www.googleapis.com/auth/gmail.send`, Google llama al callback. Este valida `state`, intercambia el `code` de un uso y devuelve `refreshToken` sin almacenarlo ni registrarlo.
5. Guardar el token en `GMAIL_REFRESH_TOKEN`, configurar el correo remitente en `GMAIL_FROM`, replicar secretos en Render, reiniciar y vaciar `GMAIL_OAUTH_SETUP_SECRET` cuando termine la preparación.

El `refresh_token` no es el token o cookie que devuelve un inicio de sesión ordinario en Gmail/Auth0. Es una credencial OAuth2 de larga duración para renovar access tokens de la cuenta remitente. El JSON de cliente OAuth aporta ID, secreto y redirect URI, pero no aporta ni el remitente ni el refresh token.

### Eventos que generan correo

| Evento | Destinatario | Condición |
|---|---|---|
| Solicitud de cita (`POST /appointments/request`) | Secretarias activas con correo | Una por cada secretaria destinataria. No se envía acuse al solicitante en esta transición. |
| Confirmación (`PATCH /appointments/:id/confirm`) | Solicitante y psicólogo asignado | Solo con correos reales, no los placeholders internos. |
| Cancelación confirmada por secretaría (`PATCH /appointments/:id/status`) o por solicitante (`PATCH /appointments/:id/cancel`) | Solicitante y psicólogo asignado | Solo si la cita estaba confirmada. |
| Creación de usuario (`POST /users`) | Usuario creado | Notifica que su cuenta está lista. |

Asignar un psicólogo, descartar una solicitud, marcar una cita realizada o editar un usuario no dispara correo actualmente.

### Reglas y consideraciones de implementación

| Regla | Motivo técnico |
|---|---|
| Usar Gmail API por HTTPS; no depender de puertos SMTP. | Es compatible con despliegues que permiten tráfico HTTPS saliente y evita acoplar el servicio a un transporte SMTP. |
| Registrar siempre la URI completa, incluido `/api/v1`: `http://localhost:3000/api/v1/auth/google/callback` en local y `https://<servicio-render>/api/v1/auth/google/callback` en producción. | NestJS usa el prefijo global `/api/v1` y el proveedor OAuth exige coincidencia exacta de la URI registrada y `GMAIL_REDIRECT_URI`. |
| Obtener `GMAIL_REFRESH_TOKEN` mediante el flujo de consentimiento; no buscarlo en el JSON del cliente OAuth. | El JSON identifica a la aplicación OAuth; el refresh token representa la autorización de la cuenta remitente. |
| Normalizar el resultado de `UPDATE ... RETURNING` en el repositorio de outbox. | TypeORM puede entregar `[rows, affectedCount]`; el servicio de entrega debe recibir exclusivamente las filas de correo. |
| Permitir los estados `pending`, `sending`, `sent` y `failed`; borrar el payload en estados terminales. | Evita reintentos indefinidos y retiene datos de contacto/contenido solo mientras se necesita entregar el mensaje. |

- Nunca guardar client secret, refresh token, setup secret ni contenido sensible del correo en código, frontend, logs o documentación versionada.
- Probar un envío con una confirmación de cita y observar `Email queued` seguido de `Email sent`; revisar Spam. Una fila `sending` abandonada se recupera cuando vence su lock de cinco minutos.

## 10.5 Base de datos Neon

TypeORM se conecta con `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`, `DATABASE_NAME` y `DATABASE_SSL`. En Neon, habilitar `DATABASE_SSL=true`; la configuración actual usa `rejectUnauthorized: false`, decisión que debe revisarse si el proveedor permite cadena/certificado validable.

- `synchronize` permanece en `false`; el cambio de esquema se entrega por migración SQL revisada y probada.
- Usar pool/timeout adecuado a la conexión Render–Neon y revisar límites de conexión del plan contratado. La configuración concreta se administra fuera del repositorio.
- Hacer backups, restauración y rotación de contraseña desde Neon/proveedor; no hay automatización de backup declarada aquí.

## 10.6 Integraciones planeadas, no implementadas

| Integración | Necesidad de producto | Precondiciones para implementar |
|---|---|---|
| Wompi | Donaciones y webhook de transacción. | Definir merchant, firma/verificación, idempotencia por transacción, estados, conciliación, datos de donante, retención y endpoints/roles. |
| WhatsApp Business/BSP | Recordatorios y notificaciones. | Aprobación de plantillas, consentimiento/opt-out, proveedor, límites, webhooks y auditoría. |
| Resend/SendGrid | Alternativa de correo. | Decisión de proveedor y un adapter de correo compatible con la outbox. |
| Exportación PDF/Excel | Reportes. | Módulo de reportes, criterios agregados, autorización, formato, retención y prueba de que no exporta PII innecesaria. |

No guardar llaves de Wompi/WhatsApp, secretos de webhook ni credenciales de proveedor en código o frontend. Toda integración nueva debe tener adapter server-side, validación de webhook/autenticidad, timeouts/reintentos/idempotencia, observabilidad sin PII, prueba de error y actualización de secciones 4, 6 y 9.
