# Contrato de API — SANA

Documento de trabajo entre frontend y backend. Lista los endpoints que el
frontend consume, con su formato de entrada y salida.

**Estado:** propuesta del frontend, pendiente de validación del backend.
**Alcance actual:** HE-01 (Gestión de usuarios y acceso) — Sprint 1.

---

## Convenciones

- URL base en desarrollo: `http://localhost:4000` (por confirmar).
- Todo el cuerpo de las peticiones y respuestas viaja en JSON (`application/json`).
- Las fechas se devuelven en formato ISO 8601 UTC: `2026-09-10T14:30:00Z`.
  El frontend se encarga de formatearlas para mostrarlas.
- Los nombres de campos van en `camelCase` y en inglés. El backend traduce
  desde los nombres de columna de la base de datos (`per_name`, `use_id`, etc.);
  esos nombres no deben llegar al frontend.
- Todas las rutas de este documento requieren sesión iniciada y rol
  Administrador, salvo que se indique lo contrario.

---

## Tipos de datos

```ts
type AccessRequest = {
  id: number;
  fullName: string;
  email: string;
  emailVerified: boolean;
  requestedAt: string;              // ISO 8601
  status: "pending" | "approved" | "rejected";
};

type User = {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  role: Role | null;
  status: "active" | "inactive" | "blocked";
  lastLoginAt: string | null;       // ISO 8601
};

type Role = {
  id: number;
  name: string;                     // "administrador", "psicologo", ...
};
```

---

## Endpoints

### Solicitudes de acceso — HU-1.2

#### `GET /access-requests`

Lista las solicitudes de acceso. Alimenta la bandeja de solicitudes.

Parámetros de consulta opcionales:

| Parámetro | Valores | Por defecto |
|---|---|---|
| `status` | `pending`, `approved`, `rejected` | `pending` |

Respuesta `200`:

```json
{
  "data": [
    {
      "id": 142,
      "fullName": "Laura Martínez Gómez",
      "email": "laura.martinez@ejemplo.com",
      "emailVerified": true,
      "requestedAt": "2026-09-08T15:45:00Z",
      "status": "pending"
    }
  ],
  "total": 3
}
```

#### `POST /access-requests/:id/approve`

Aprueba una solicitud y asigna el rol. Debe activar la cuenta y notificar al
usuario por correo (HU-1.2, escenario 1).

Cuerpo:

```json
{ "roleId": 5 }
```

Respuesta `200`: el `User` creado.

Errores esperados:

| Código | Cuándo | Qué muestra el frontend |
|---|---|---|
| `400` | Falta `roleId` o no es un rol asignable | Mensaje de validación en el modal |
| `404` | La solicitud no existe | Aviso y recarga de la lista |
| `409` | La solicitud ya fue procesada por otro administrador | Aviso y recarga de la lista |

#### `POST /access-requests/:id/reject`

Rechaza una solicitud. El motivo es opcional y se guarda para auditoría
(máximo 200 caracteres).

Cuerpo:

```json
{ "reason": "No pertenece al equipo de la fundación" }
```

Respuesta `200`: `{ "ok": true }`

---

### Usuarios — HU-1.3

#### `GET /users`

Lista los usuarios del sistema.

Parámetros de consulta opcionales:

| Parámetro | Valores |
|---|---|
| `status` | `active`, `inactive`, `blocked` |
| `search` | texto libre, busca por nombre o correo |

Respuesta `200`: misma forma que `/access-requests`, con objetos `User`.

#### `PATCH /users/:id`

Edita los datos básicos. Solo se envían los campos que cambian.

```json
{ "fullName": "Elena Navarro", "phone": "3001234567" }
```

Error `409` si el correo ya está registrado en otra cuenta.

#### `PATCH /users/:id/status`

Bloquea, desactiva o reactiva la cuenta. Al bloquear o desactivar deben
cerrarse las sesiones activas del usuario.

```json
{ "status": "blocked", "reason": "Licencia temporal" }
```

#### `PATCH /users/:id/role`

Reemplaza el rol del usuario. Un usuario mantiene **un solo rol activo**:
asignar uno nuevo revoca el anterior (HU-1.2, escenario 4).

```json
{ "roleId": 2 }
```

#### `DELETE /users/:id`

Elimina la cuenta. Debe rechazarse cuando el usuario tiene registros
asociados, para preservar la trazabilidad (HU-1.3, escenario 4).

Error `409` con el detalle de por qué no se puede:

```json
{
  "error": "USER_HAS_RECORDS",
  "message": "El usuario tiene registros asociados",
  "details": { "appointments": 14 }
}
```

---

### Catálogos

#### `GET /roles`

Alimenta el selector de rol del modal de aprobación.

Debe devolver **solo los roles asignables a cuentas del sistema**:
administrador, secretario, psicólogo y marketing. El rol `consultante` no
aplica, porque el consultante no tiene cuenta en la plataforma (HU-2.2).

```json
{
  "data": [
    { "id": 4, "name": "administrador" },
    { "id": 1, "name": "secretario" },
    { "id": 5, "name": "psicologo" },
    { "id": 2, "name": "marketing" }
  ]
}
```

---

## Formato de errores

Todas las respuestas de error deben tener la misma forma, para poder
manejarlas en un solo lugar del frontend:

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Texto legible para mostrar al usuario",
  "details": {}
}
```

---

## Pendiente de definir

1. **Autenticación con Google.** ¿El flujo OAuth vive en Next.js (Auth.js) o en
   NestJS (Passport)? De esto depende cómo se autentican todas las peticiones
   de arriba: cookie de sesión o `Authorization: Bearer <token>`.

2. **Estado `pending` en la base de datos.** `person.per_state` solo acepta
   `activo`, `inactivo` y `bloqueado`. Falta el estado pendiente y una tabla
   para las solicitudes de acceso; sin eso HU-1.2 no se puede implementar.

3. **Un rol por usuario.** `person_rol` tiene la llave primaria en
   `(per_id, rol_id)`, lo que permite varios roles por persona. HU-1.2
   escenario 4 exige uno solo activo.

4. **Última conexión y bitácora.** `GET /users` devuelve `lastLoginAt`, pero
   no existe ese campo. Tampoco hay tabla de bitácora, que HU-1.1 escenario 5
   necesita para registrar los intentos de acceso denegados.

5. **Paginación.** Definir si `GET /users` la necesita y con qué parámetros
   (`page` y `pageSize`, o `limit` y `offset`).
