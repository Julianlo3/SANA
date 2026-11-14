# SANA Backend

Servicios backend y API REST de la plataforma **SANA** (Fundación Huellitas), desarrollados con **NestJS**, **TypeScript**, **PostgreSQL** y autenticación federada con **Auth0**.

## Módulos principales

- **`appointments`**: Gestión y flujo de estados de citas (asignación, confirmación, descarte y cancelación).
- **`schedule`**: Disponibilidad de horarios, bloques recurrentes y citas públicas.
- **`clinical-notes`**: Registro, versionado y auditoría de notas clínicas y atención psicológica.
- **`auth`**: Integración con Auth0, validación de JWT, roles y permisos de acceso.
- **`users`**: Administración de perfiles, roles, profesionales y dependientes.
- **`care-packages`**: Paquetes de atención integral y seguimiento.
- **`content`**: Gestión de banners, tarjetas informativas y galerías públicas.
- **`policy`**: Registro y auditoría de aceptación de políticas y términos legales.
- **`security-logs`**: Trazabilidad y auditoría de eventos de seguridad.

## Scripts del proyecto

```bash
# Instalación de dependencias
npm install

# Ejecución en desarrollo
npm run start:dev

# Compilación de producción
npm run build

# Pruebas unitarias y cobertura
npm run test:cov

# Documentación OpenAPI / Swagger
npm run openapi:generate

# Generación de documentación técnica con TypeDoc
npm run docs:code
```
