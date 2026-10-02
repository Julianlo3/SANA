<!-- responsable: Andrés | estado: borrador -->
# 2. Alcance

## 2.1 Incluido

Épicas HE-01 a HE-06 con las historias de usuario de la sección 7.

## 2.2 Excluido

- EX-01. Módulos 8, 9 y 10 del documento de requisitos original. [PENDIENTE: nombre y descripción de cada módulo para que puedan identificarse.]
- EX-02. Flujo de solicitud de acceso con aprobación o rechazo. Descartado el 2026-09-11: el Administrador crea las cuentas directamente y asigna el rol en la misma operación.

## 2.3 Priorización

Método MoSCoW. [PENDIENTE: prioridad de cada HU (Must, Should, Could, Won't).]

## 2.4 Decisiones abiertas

- DA-01. [CONFIRMAR: un usuario puede tener varios roles (el modelo de datos ya lo admite). Mecanismo de interfaz: (1) un rol activo a la vez con selector de rol; (2) todos los roles activos simultáneamente, con desactivación temporal por parte del Administrador.]
- DA-02. [CONFIRMAR: el rol Psicólogo es exclusivo (no combinable con Asistente ni Marketing) para restringir el acceso a información clínica.]
