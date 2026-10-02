<!-- responsable: Braian | estado: borrador -->
# 6. Modelo de datos

## 6.1 Diagrama entidad-relación

[PENDIENTE: diagrama `erDiagram` en Mermaid del esquema actual en Neon.]

## 6.2 Entidades

Para cada entidad se especifica: tabla, columnas (nombre, tipo, nulabilidad, valor por defecto), llave primaria, llaves foráneas, índices y restricciones.

| Entidad | Requisitos conocidos |
|---|---|
| person / user | `per_state` (estado de cuenta), `user_last_login_at`. [PENDIENTE: resto de columnas] |
| user_role | Relación N:M usuario-rol |
| consultant | Campo de consentimiento modelado desde el inicio aunque no se use en el MVP. [PENDIENTE] |
| guardian | Parentesco con selección múltiple (madre, padre, abuelo, abuela, tío, tía, otro). [PENDIENTE] |
| appointment | [PENDIENTE] |
| institutional_content | [PENDIENTE] |
| donation_setting | [PENDIENTE] |
| donation | Estado con al menos: por verificar, confirmada. [PENDIENTE] |
| audit_log | [PENDIENTE] |

## 6.3 Reglas

- DB-01. Todo cambio de esquema se realiza mediante migraciones versionadas; no se usa `synchronize: true` fuera de desarrollo local.
- DB-02. Los datos semilla usan exclusivamente información ficticia.
