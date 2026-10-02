<!-- responsable: Braian, Andrés | estado: borrador -->
# 9. Contratos de la API

## 9.1 Convenciones

- REST sobre HTTPS, JSON, prefijo `/api`. [PENDIENTE: estrategia de versionado.]
- Documentación OpenAPI generada automáticamente.
- Formato de error: [PENDIENTE: estructura estándar, p. ej. `{ "statusCode": 400, "message": "...", "error": "Bad Request" }`].

## 9.2 Endpoints

Para cada endpoint: método, ruta, rol requerido, cuerpo de solicitud, respuesta, códigos de error y HU asociada.

| Método | Ruta | Rol | HU | Descripción |
|---|---|---|---|---|
| GET | /api/auth/google | Público | HU-1.1 | Inicio del flujo OAuth |
| GET | /api/auth/google/callback | Público | HU-1.1 | Callback OAuth; emite la cookie de sesión |
| POST | /api/users | ADMIN | HU-1.2 | Creación directa de usuario con rol(es) |
| GET | /api/users | ADMIN | HU-1.3 | Listado de usuarios |
| [PENDIENTE] | | | | Endpoints de HE-02 a HE-06 |

[CONFIRMAR: paginación de `GET /api/users`: (1) en servidor con `page` y `limit`; (2) lista completa con filtrado en cliente.]
