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
type UserRoleAssignment = {
  id: number;
  name: string;                     // "administrador", "psicologo", ...
  active: boolean;                  // se puede desactivar sin quitar el rol
};

type User = {
  id: number;
  fullName: string;
  identityDocument: string | null;
  email: string;
  phone: string | null;
  roles: UserRoleAssignment[];      // un usuario puede tener varios roles a la vez
  status: "active" | "inactive" | "blocked";
  lastLoginAt: string | null;       // ISO 8601
};
```

---

## Endpoints

### Crear usuario — HU-1.2

*(Actualizado 14/09: el equipo descartó la bandeja de solicitudes con
aprobar/rechazar que describía esta sección. El Administrador crea la cuenta
directamente, con nombre, documento, correo de Google y rol — sin solicitud
pendiente ni notificación de aprobación.)*

#### `POST /users`

Cuerpo:

```json
{
  "fullName": "Elena Navarro",
  "identityDocument": "1061234567",
  "email": "elena.navarro@gmail.com",
  "phone": "3001234567",
  "roleId": 5
}
```

- `email` debe ser una cuenta de Google (`@gmail.com` o `@googlemail.com`),
  porque el acceso es por OAuth.
- `roleId` debe ser uno de los roles asignables a cuentas del sistema
  (administrador, secretario, psicologo, marketing).

Respuesta `201`: el `User` creado, con `status: "active"`.

Errores esperados:

| Código | Cuándo |
|---|---|
| `400` | `roleId` no es un rol asignable |
| `409` | El correo ya pertenece a una cuenta que ya inició sesión alguna vez |
| `422` | Falta un campo obligatorio o no cumple el formato (correo que no es de Google, documento/telefono con formato invalido, etc.) |

Si alguien ya habia intentado iniciar sesion con ese correo antes de ser
creado (queda registrado como persona en estado `pendiente`), crear el
usuario con ese mismo correo lo promueve a activo en vez de fallar por
correo duplicado.

---

### Usuarios — HU-1.3

#### `GET /users`

Lista los usuarios del sistema.

Parámetros de consulta opcionales:

| Parámetro | Valores |
|---|---|
| `status` | `active`, `inactive`, `blocked` |
| `search` | texto libre, busca por nombre o correo |

Respuesta `200`: arreglo de objetos `User` (no incluye personas en estado
`pendiente`: esas no son cuentas administradas por este modulo todavia).

#### `PATCH /users/:id`

Edita los datos básicos y, opcionalmente, los roles asignados. Todos los
campos son opcionales; se envían solo los que cambian. El correo **no** es
editable aquí: es la cuenta de Google con la que la persona inicia sesión.

```json
{
  "fullName": "Elena Navarro",
  "identityDocument": "1061234567",
  "phone": "3001234567",
  "roles": [
    { "roleId": 5, "active": true },
    { "roleId": 2, "active": false }
  ]
}
```

*(Actualizado 14/09: un usuario puede tener **varios roles a la vez**, cada
uno activable/desactivable por separado sin quitarlo — reemplaza el "un solo
rol activo, PATCH /users/:id/role" de una version anterior de este documento,
para que coincida con lo que ya maqueto Liseth en `feat/auth-states`. Si se
envia `roles`, reemplaza el conjunto completo — debe quedar al menos uno.)*

#### `PATCH /users/:id/status`

Bloquea, desactiva o reactiva la cuenta. Al bloquear deben cerrarse las
sesiones activas del usuario.

```json
{ "status": "blocked", "reason": "Licencia temporal" }
```

`reason` se acepta pero todavia no se persiste (no hay columna/tabla de
bitacora para guardarlo).

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

*(No implementado todavia — el formulario de creación y la edición de roles
hoy usan una lista fija en el frontend. Falta este endpoint para que dejen de
depender de esa lista fija.)*

Alimenta el selector de rol del formulario de creación y el checklist de
roles de la edición de usuario.

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

1. ~~**Autenticación con Google.**~~ Resuelto: el backend (NestJS) verifica el
   `idToken` de Google directamente con `google-auth-library`, sin Passport.
   El frontend debe usar Google Identity Services (JS), mandar el `idToken` a
   `POST /auth/sessions` y despues autenticar cada peticion con
   `Authorization: Bearer <accessToken>`. Sigue pendiente que el frontend de
   login se conecte a esto (hoy es un mockup sin `fetch`) — eso es de
   Braian/Liseth, no de este documento.

2. ~~**Estado `pending` en la base de datos.**~~ Resuelto (migracion del
   11/09): `person.per_state` ya acepta `pendiente`, y existe la tabla
   `access_requests`.

3. ~~**Un rol por usuario.**~~ Resuelto distinto a como decia esta seccion: el
   14/09 el equipo decidio permitir **varios roles por persona** en vez de
   uno solo (ver `PATCH /users/:id` arriba). `person_rol` gano una columna
   `pr_active` para poder desactivar un rol sin quitarlo.

4. **Última conexión y bitácora.** La columna `user_last_login_at` ya existe
   (migracion del 11/09) y `GET /users` ya la expone, pero nadie la escribe
   todavia — eso es parte del login de Braian, no de este modulo. La bitacora
   de intentos de acceso denegados por rol (HU-1.1 escenario 5) sigue sin
   existir: ni tabla ni logging en `RolesGuard`.

5. **Paginación.** Sigue sin definir si `GET /users` la necesita y con qué
   parámetros (`page` y `pageSize`, o `limit` y `offset`). Hoy devuelve todo
   sin paginar.

6. **`GET /roles`.** Sigue sin implementar (ver nota en Catálogos arriba).
