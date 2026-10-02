<!-- responsable: Braian | estado: borrador -->
# 5. Arquitectura y patrones de diseño

## 5.1 Arquitectura general

[PENDIENTE: estilo arquitectónico (cliente-servidor, SPA + API REST, backend en capas controller/service/repository) y diagrama de componentes en Mermaid.]

## 5.2 Módulos del backend

| Módulo | Épica | Responsabilidad |
|---|---|---|
| auth | HE-01 | OAuth, emisión y validación de JWT, sesión |
| users | HE-01 | CRUD de usuarios, asignación de roles, estados de cuenta |
| consultants | HE-02 | Fichas de consultantes y acudientes |
| appointments | HE-03 | Citas, disponibilidad, reprogramación y cancelación |
| content | HE-04 | Contenido institucional |
| donations | HE-05 | Configuración de medios de donación y registro de donaciones |
| reports | HE-06 | Reportes agregados |
| audit | Transversal | Registro de accesos denegados y cambios relevantes |

## 5.3 Patrones de diseño

| Patrón | Aplicación | Justificación |
|---|---|---|
| Repository | Acceso a datos vía TypeORM | [PENDIENTE] |
| DTO con validación declarativa | Entrada de cada endpoint | [PENDIENTE] |
| Guard / Middleware | Autenticación y autorización | [PENDIENTE] |
| Inyección de dependencias | Servicios y repositorios | [PENDIENTE] |
| [PENDIENTE] | | |

## 5.4 Principios

- Sin lógica de negocio en controladores.
- Dependencias externas (correo, pasarela, mensajería) detrás de interfaces para permitir su sustitución y su simulación en pruebas.
