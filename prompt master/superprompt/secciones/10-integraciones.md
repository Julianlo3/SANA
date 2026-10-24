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
| SMTP/Nodemailer | Correo transaccional. | Implementado de forma configurable; sin credenciales válidas se desactiva. No hay proveedor fijado. |

Vercel, Render y Neon son los proveedores activos de despliegue/persistencia. Sus configuraciones operativas no están versionadas en este repositorio. Wompi, WhatsApp, Resend y SendGrid no están integrados en el código actual.

## 10.2 Auth0

**Flujo.** El usuario se autentica con Auth0 mediante el SDK de Next.js. Al invocar `/api/backend/*`, el route handler intenta obtener el access token y lo reenvía como Bearer a NestJS. `JwtAuthGuard` verifica el token y `AuthService` resuelve/sincroniza la persona y sus roles locales. La API no crea un endpoint propio `/auth/google` ni emite cookies JWT.

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

## 10.4 SMTP y outbox

El backend lee `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` y `SMTP_FROM`. Construye transporte seguro (TLS 1.2+, certificado verificado), encola mensajes en `email_outbox`, reclama lotes de hasta diez, reintenta hasta ocho veces con backoff exponencial y borra destinatario/asunto/cuerpo al marcar `sent`.

- La entrega de correo no debe bloquear ni deshacer el caso de uso principal si SMTP está ausente o falla, salvo requisito futuro explícito.
- Nunca guardar contraseña SMTP ni contenido sensible en logs. La outbox es sensible mientras haya payload pendiente; restringir su acceso y retención.
- Antes de elegir Resend, SendGrid u otro proveedor, definir contrato de entrega, bounces, remitente, costos, DPA y pruebas sandbox. No sustituir Nodemailer/SMTP sin esa decisión.

## 10.5 Base de datos Neon

TypeORM se conecta con `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`, `DATABASE_NAME` y `DATABASE_SSL`. En Neon, habilitar `DATABASE_SSL=true`; la configuración actual usa `rejectUnauthorized: false`, decisión que debe revisarse si el proveedor permite cadena/certificado validable.

- `synchronize` permanece en `false`; el cambio de esquema se entrega por migración SQL revisada y probada.
- Usar pool/timeout adecuado a la conexión Render–Neon y revisar límites de conexión del plan contratado. La configuración concreta se administra fuera del repositorio.
- Hacer backups, restauración y rotación de contraseña desde Neon/proveedor; no hay automatización de backup declarada aquí.

## 10.6 Integraciones planeadas, no implementadas

| Integración | Necesidad de producto | Precondiciones para implementar |
|---|---|---|
| Wompi | Donaciones y webhook de transacción. | Definir merchant, firma/verificación, idempotencia por transacción, estados, conciliación, datos de donante, retención y endpoints/roles. |
| WhatsApp Business/BSP | No existe aún y no se manejará según la decisión vigente. | No implementar integración, plantillas, webhooks ni flujos de notificación por WhatsApp. |
| Resend/SendGrid | Alternativa de correo. | Decisión de proveedor y migración del adapter SMTP/outbox. |
| Exportación PDF/Excel | Reportes. | Módulo de reportes, criterios agregados, autorización, formato, retención y prueba de que no exporta PII innecesaria. |

No guardar llaves de Wompi/WhatsApp, secretos de webhook ni credenciales de proveedor en código o frontend. Toda integración nueva debe tener adapter server-side, validación de webhook/autenticidad, timeouts/reintentos/idempotencia, observabilidad sin PII, prueba de error y actualización de secciones 4, 6 y 9.
