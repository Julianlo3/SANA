<!-- responsable: Braian, Andrés | estado: borrador -->
# 3. Roles y permisos

## 3.1 Roles

| Código | Rol | Responsabilidad |
|---|---|---|
| ADMIN | Administrador | Gestión de usuarios y roles, configuración de donaciones, reportes |
| ASSISTANT | Asistente administrativa | Fichas de consultantes (datos básicos y administrativos) y agenda |
| PSYCHOLOGIST | Psicólogo | Agenda propia y seguimiento de consultantes asignados |
| MARKETING | Diseñadora (Marketing y Comunicaciones) | Contenido institucional |
| — | Visitante | Sitio público y donaciones (sin sesión) |

[CONFIRMAR: en una iteración anterior el modelo se redujo a dos roles autenticados y un flujo público; las HU vigentes usan cuatro roles autenticados. Confirmar la lista definitiva.]

## 3.2 Matriz de permisos

[PENDIENTE: matriz rol x recurso x operación (crear, leer, actualizar, eliminar) para: users, consultants, guardians, appointments, content, donation_settings, donations, reports. Restricción conocida: ASSISTANT no accede al seguimiento clínico.]

## 3.3 Reglas de autorización

- AUT-01. La autorización se aplica en el backend mediante un guard de roles (`RolesGuard`) en cada endpoint protegido. El ocultamiento de opciones en el frontend no sustituye esta validación.
- AUT-02. Todo acceso denegado se registra en la tabla de auditoría (usuario, recurso, fecha y hora, IP).
- AUT-03. Cada inicio de sesión exitoso actualiza `user_last_login_at`.
- AUT-04. Una cuenta en estado bloqueado o desactivado no puede iniciar sesión.
