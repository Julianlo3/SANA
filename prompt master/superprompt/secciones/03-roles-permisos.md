<!-- responsable: Braian, Andrés | estado: documentado según código vigente -->
# 3. Roles y permisos

## 3.1 Roles vigentes en el código

Los nombres de rol que intercambian el frontend y backend son los valores exactos en minúscula:

| Código | Valor técnico | Nombre visible | Responsabilidad según las pantallas actuales |
|---|---|---|---|
| ADMIN | `administrador` | Administrador | Gestiona usuarios y contenido institucional; consulta logs de seguridad. También puede acceder al layout general de personal. |
| SECRETARY | `secretario` | Asistente administrativa / secretaria | Gestiona solicitudes y agenda, y administra fichas administrativas de consultantes. |
| PSYCHOLOGIST | `psicologo` | Psicólogo | Gestiona citas asignadas, disponibilidad y atenciones/notas clínicas. |
| MARKETING | `marketing` | Marketing y diseño | Administra contenido, noticias, banners y galería. |
| REQUESTER | `consultante` | Consultante | Consulta su cuenta, solicitudes y citas propias. |
| PENDING | `pendiente` | Cuenta pendiente | Es un estado/rol reconocido por el backend, pero no tiene acceso habilitado a las pantallas internas identificadas. |
| — | Sin sesión | Visitante | Accede al sitio público y puede enviar una solicitud pública de cita. |

El administrador puede asignar los cuatro roles internos (`administrador`, `secretario`, `psicologo`, `marketing`). El rol `consultante` se origina en el flujo público, no en el catálogo de roles del panel. El código no debe tratar `pendiente` como un rol interno autorizado.

## 3.2 Autorización de pantallas del frontend

Las rutas siguientes son rutas de página Next.js. Los grupos entre paréntesis son grupos de organización y no forman parte de la URL:

| Pantallas / rutas | Acceso implementado |
|---|---|
| Sitio público: `/`, `/noticias`, `/noticias/:id`, `/solicitar-cita`, `/solicitar-cita/adulto`, `/solicitar-cita/menor`, `/solicitar-cita/confirmacion` | Público, sin sesión. El envío de cita se valida además en el backend. |
| `/usuarios`, `/usuarios/nuevo`, `/usuarios/:id/editar` | Solo `administrador`, exigido por el layout `(dashboard)` mediante `requireAdministrator`. |
| `/contenido/institucional`, `/contenido/noticias`, `/contenido/banners`, `/contenido/galeria` | `administrador` o `marketing`, exigido por el layout `(content)`. |
| `/solicitudes`, `/solicitudes/:id` | Solo `secretario`, exigido en cada página; el layout `(staff)` también requiere uno de `secretario`, `psicologo`, `administrador`. |
| `/calendario` | Solo `secretario`, exigido en la página y por el layout `(staff)`. |
| `/mis-citas`, `/mi-disponibilidad` | Solo `psicologo`, exigido en la página y por el layout `(staff)`. |
| `/consultantes`, `/consultantes/:id`, `/consultantes/:id/resumen`, `/registro-atencion/nuevo` | El layout `(staff)` permite `secretario`, `psicologo` o `administrador`. Las páginas de consultantes no agregan una restricción de rol más fina; el listado elige vista de psicólogo si el usuario tiene ese rol y, en otro caso, vista administrativa. La página de registro de atención tampoco restringe el rol individualmente. |
| `/mi-cuenta` | Solo `consultante`, exigido por el layout `(consultante)`. |
| `/panel` | Requiere sesión válida mediante `getCurrentUser`; redirige según rol a `/usuarios`, `/consultantes`, `/contenido/institucional`, `/mi-cuenta`, `/cuenta-pendiente` o `/acceso-restringido`. No es una pantalla de contenido propia. |
| `/iniciar-sesion`, `/sesion-expirada`, `/acceso-restringido`, `/cuenta-pendiente` | Pantallas de autenticación/estado. |

El menú lateral solo controla qué enlaces se muestran; no es un control de autorización. Las rutas deben continuar protegidas por servidor/layout y los endpoints backend deben validar sesión, rol y alcance del recurso.

## 3.3 Autorización de endpoints del backend

La API usa el prefijo `/api/v1`. En las tablas, `:id`, `:type`, `:appId` y otros parámetros representan segmentos dinámicos. Los métodos separados por coma aplican al endpoint indicado.

### 3.3.1 Endpoints públicos y de sesión

| Endpoint | Acceso |
|---|---|
| `GET /api/v1/`, `GET /api/v1/healthz` | Público; comprobación de servicio/salud. |
| `POST /api/v1/appointments/request` | Público; crea una solicitud de cita para la persona solicitante o un menor dependiente. |
| `GET /api/v1/policy/:type` | Público; obtiene el documento de política vigente. |
| `GET /api/v1/public/content`, `GET /api/v1/public/news`, `GET /api/v1/public/news/:id`, `GET /api/v1/public/banners`, `GET /api/v1/public/gallery-images` | Público; solo contenido publicado/activo, con limitación de solicitudes. |
| `GET /api/v1/auth/me`, `PATCH /api/v1/auth/terms`, `PATCH /api/v1/auth/psychologist-terms`, `DELETE /api/v1/auth/sessions/current` | Cualquier usuario con JWT válido. No hay `RolesGuard` ni rol explícito en estos métodos. El endpoint `psychologist-terms` no restringe el rol a psicólogo en el controlador actual. |
| `GET /api/v1/users/me`, `PATCH /api/v1/users/me` | Cualquier usuario autenticado con uno de estos roles: `administrador`, `secretario`, `psicologo`, `marketing`, `consultante`. Las reglas de campos editables se aplican en el servicio según los roles. |

### 3.3.2 Recursos protegidos por rol

| Recurso / endpoints | Rol(es) autorizados | Operaciones |
|---|---|---|
| `/users` | `administrador` | `GET /`, `GET /:id`, `POST /`, `PATCH /:id`, `PATCH /:id/status`, `DELETE /:id`: lista, consulta, crea, actualiza, cambia estado y elimina usuarios. |
| `/consultants` ficha administrativa | `secretario` | `GET /`, `GET /:id`, `POST /`, `PATCH /:id`: consulta y actualiza fichas administrativas de consultantes. |
| `/consultants` vista clínica propia | `psicologo` | `GET /mine`, `GET /:id/full`: consulta solo consultantes con citas propias asignadas y su ficha completa autorizada. |
| `/appointments` solicitudes | `secretario` | `GET /`, `GET /:id`, `GET /psychologists`, `GET /:id/psychologist-history`; `PATCH /:id/confirm`, `/assign`, `/discard`, `/status`: gestiona y confirma solicitudes, asigna psicólogo y consulta el historial de asignación. |
| `/appointments` propias del consultante | `consultante` | `GET /my-requests`, `PATCH /:id/cancel`: consulta y cancela/retira sus propias solicitudes/citas; el servicio restringe la operación a la identidad del usuario autenticado. |
| `/appointments` asignadas al psicólogo | `psicologo` | `GET /relationships`, `GET /my-appointments`, `GET /my-appointments/:id`, `PATCH /:id/complete`: consulta el catálogo de parentescos y citas propias asignadas, y marca una cita como realizada. El servicio valida la asignación al psicólogo. |
| `/schedule/me/blocks`, `/schedule/me/recurring-blocks` | `psicologo` | `GET`, `POST` en ambas rutas; `DELETE /me/blocks/:id` y `DELETE /me/recurring-blocks/:id`: administra su propia disponibilidad/bloqueos. |
| `/schedule/me/accept-terms`, `/schedule/me/terms-status` | `psicologo` | `POST` acepta los términos de agenda; `GET` consulta estado. |
| `/schedule/psychologists/:psychologistId/blocks`, `/schedule/psychologists/:psychologistId/calendar`, `/schedule/availability` | `secretario` | `GET`: consulta bloques, calendario y disponibilidad para coordinar citas. |
| `/clinical-notes/register-attention`, `/clinical-notes/appointment/:appId`, `/clinical-notes/consultant/:requesterId/history`, `/clinical-notes/:cnId`, `/clinical-notes/:cnId/audit` | `psicologo` | `POST` registra atención; `GET` consulta nota, historial y auditoría. El servicio también aplica control de acceso al registro/cita/consultante; el rol por sí solo no debe considerarse autorización suficiente sobre datos clínicos. |
| `/content-items` | `administrador`, `marketing` | `GET /`, `PATCH /`: consulta y edita contenido institucional de valor único (p. ej., misión y visión). |
| `/content-cards` | `administrador`, `marketing` | `GET /`, `POST /`, `PATCH /:id`, `DELETE /:id`: gestiona tarjetas/listas de contenido institucional. |
| `/news` | `administrador`, `marketing` | `GET /`, `POST /`, `PATCH /:id`, `PATCH /:id/status`, `PATCH /:id/pin`, `DELETE /:id`: administra noticias, publicación y fijación. |
| `/banners` | `administrador`, `marketing` | `GET /`, `POST /`, `PATCH /:id`, `PATCH /:id/activation`, `DELETE /:id`: administra banners. |
| `/gallery-images` | `administrador`, `marketing` | `GET /`, `POST /`, `PATCH /:id`, `PATCH /:id/status`, `DELETE /:id`: administra imágenes y estado de publicación de galería. |
| `/image-upload-signatures` | `administrador`, `marketing` | `POST /`: solicita firma para cargar imágenes. |
| `/security-logs` | `administrador` | `GET /`: consulta eventos de rechazo por rol, con filtros opcionales de usuario/fecha. |

En rutas protegidas, `OriginGuard` y `JwtAuthGuard` complementan la autorización según el controlador. El `RolesGuard` combina metadatos del método y de la clase; el metadato del método prevalece. Por tanto, las excepciones de autoservicio de `/users/me` autorizan los roles indicados aunque la clase completa esté restringida por defecto a administración.

## 3.4 Relación vigente entre pantalla y endpoint

El código actual es la definición aprobada del acceso. Los layouts y páginas determinan qué interfaz se puede navegar; el backend determina la autorización efectiva de datos y operaciones. Esta diferencia es intencional en las superficies siguientes y no autoriza a ampliar endpoints ni datos de respuesta.

| Superficie | Navegación implementada | Autorización efectiva vigente |
|---|---|---|
| Consultantes (`/consultantes`, detalle y resumen) | El layout `(staff)` permite `secretario`, `psicologo` y `administrador`; el listado selecciona vista de psicólogo cuando corresponde y administrativa en los demás casos. | Secretaría usa la ficha administrativa (`GET /consultants`, `/:id`); psicología usa `/mine` y `/:id/full` con comprobación de asignación. Administración puede entrar al layout, pero no cuenta con endpoint de ficha administrativa propio. |
| Registro de atención (`/registro-atencion/nuevo`) | Hereda acceso de layout de personal. | El registro y toda lectura de notas clínicas requieren `psicologo`; los demás roles reciben denegación del backend. |
| `/panel` | Exige sesión y redirige según el rol. | Es una ruta de decisión/navegación; no expone un recurso backend propio. |
| Términos de psicólogo | La interfaz de disponibilidad está reservada a `psicologo`. | `PATCH /auth/psychologist-terms` admite cualquier JWT válido porque el controlador no aplica `RolesGuard`; este es el permiso vigente del endpoint. Las rutas de agenda sí exigen `psicologo`. |

La UI nunca sustituye el control backend. Las comprobaciones de pertenencia/asignación y privacidad de datos se aplican en el servicio además del rol, incluso cuando una ruta de pantalla sea navegable por más de un rol.

## 3.5 Reglas de autorización

- AUT-01. La autorización efectiva se aplica en el backend en cada endpoint protegido. Ocultar enlaces o proteger un layout del frontend no sustituye guards, roles ni autorización a nivel de registro.
- AUT-02. Un usuario solo puede operar sobre recursos propios o asignados cuando así lo exige el dominio (p. ej., solicitudes del consultante, citas del psicólogo y notas clínicas); la validación debe derivar la identidad de la sesión/JWT, no confiar en un identificador enviado por el cliente.
- AUT-03. Los endpoints públicos se limitan a las operaciones expresamente marcadas como públicas; no deben entregar registros no publicados ni datos personales.
- AUT-04. El backend responde con denegación de autorización cuando falte el rol exigido. Los intentos autenticados con rol insuficiente se registran mediante `RolesGuard`; el acceso de lectura de logs se reserva a `administrador`.
- AUT-05. Cada inicio de sesión exitoso actualiza `user_last_login_at`.
- AUT-06. Una cuenta bloqueada o desactivada no puede iniciar sesión.
- AUT-07. Los roles de frontend y backend deben usar los mismos valores técnicos exactos. Cambios de roles/permisos requieren actualizar API, pantallas, menú, pruebas y esta matriz.

## 3.6 Alcance aún no implementado

- [PENDIENTE: definir roles y operaciones de donaciones, configuración de donaciones y reportes. No hay endpoints ni pantallas implementados que otorguen permisos para estas capacidades.]
