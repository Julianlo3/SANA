# Batería de Pruebas Postman — SANA Backend API

Esta carpeta contiene la batería integral de pruebas E2E para validar todos los flujos de negocio, reglas de dominio y controles de seguridad (RBAC, `OriginGuard`, JWT Auth0) del backend de **SANA** sobre los datos sembrados en [seed-test-battery.sql](../../../DataBase/seeds/seed-test-battery.sql).

## Archivos

- **`SANA Backend.postman_collection.json`**: colección v2.1.0 organizada en **13 carpetas** (flujos E2E `00`–`11` + matriz de seguridad `12`) con **181 peticiones** (100% de cobertura de rutas del backend), scripts pre-request de fechas futuras seguras (semana `+3` desde el lunes actual) y aserciones automáticas `pm.test(...)`.
- **`SANA.postman_environment.json`**: entorno con `baseUrl`, `origin`, `wompiEventsSecret` y los **tokens Bearer por rol** para correr la batería de corrido con **Collection Runner** o **Newman** sin tener que volver a iniciar sesión al cambiar de rol.

---

## Preparación paso a paso

### 1. Cargar los datos sintéticos en la base de pruebas
Ejecuta primero el esquema [01-schema-neon-new.sql](../../../DataBase/init-scripts/01-schema-neon-new.sql) (si la BD es nueva) y luego el seed de pruebas:

```powershell
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "DataBase/seeds/seed-test-battery.sql"
```

### 2. Asociar tus cuentas reales de Auth0/Google (en BD de pruebas)
`JwtAuthGuard` valida el JWT de Auth0 y busca el usuario local en `person`/`users` por `user_provider_id` (claim `sub`) o por `lower(per_email)`. Si tus cuentas de prueba en Auth0 tienen correos propios, actualízalos en tu base de pruebas y borra su `user_provider_id` temporal (o sustitúyelo por tu `sub` real) para que se reclamen automáticamente al primer login:

```sql
-- Ejemplo: asignar tus correos reales de prueba a los actores principales del seed
UPDATE public.person SET per_email = 'tu.admin@gmail.com'       WHERE per_id = 1;  -- Administrador
UPDATE public.person SET per_email = 'tu.secretaria@gmail.com'  WHERE per_id = 2;  -- Secretaría
UPDATE public.person SET per_email = 'tu.marketing@gmail.com'   WHERE per_id = 4;  -- Marketing
UPDATE public.person SET per_email = 'tu.psicologo1@gmail.com'  WHERE per_id = 5;  -- Psicólogo 1 (Dra. Laura)
UPDATE public.person SET per_email = 'tu.psicologo2@gmail.com'  WHERE per_id = 6;  -- Psicólogo 2 (Dr. Andrés)
UPDATE public.person SET per_email = 'tu.psicologo3@gmail.com'  WHERE per_id = 7;  -- Psicólogo 3 (Dra. Mariana)
UPDATE public.person SET per_email = 'tu.consultante1@gmail.com' WHERE per_id = 13; -- Consultante (paquete activo)
UPDATE public.person SET per_email = 'tu.consultante2@gmail.com' WHERE per_id = 14; -- Consultante (paquete finalizado)

-- Permite re-vincular automáticamente con el sub real de Auth0 en el primer request
DELETE FROM public.users WHERE use_id IN (1, 2, 4, 5, 6, 7, 13, 14);
```

### 3. Importar en Postman y configurar el Environment
1. En Postman, importa **`SANA Backend.postman_collection.json`** y **`SANA.postman_environment.json`**.
2. Selecciona el entorno **SANA — Entorno Batería de Pruebas**.
3. Verifica `baseUrl` (por defecto `http://localhost:3000/api/v1`) y `origin` (debe estar incluido en la variable `CORS_ORIGIN` del backend, ej. `http://localhost:3001`).
4. Rellena los tokens Bearer de cada actor (nunca hagas commit de los tokens en Git; usa la columna *Current value* en Postman):

| Variable | Actor en `seed-test-battery.sql` | Rol |
| :--- | :--- | :--- |
| `tokenAdmin` | `per_id = 1` (Rosse Mary Gómez) | `administrador` |
| `tokenSecretary` | `per_id = 2` (Camila Rojas) | `secretario` |
| `tokenMarketing` | `per_id = 4` (Santiago Morales) | `marketing` |
| `tokenPsychologist` | `per_id = 5` (Dra. Laura Hernández) | `psicologo` |
| `tokenPsychologist2` | `per_id = 6` (Dr. Andrés Ramírez) | `psicologo` |
| `tokenPsychologist3` | `per_id = 7` (Dra. Mariana Trujillo) | `psicologo` |
| `tokenConsultant` | `per_id = 13` (María Fernanda López) | `consultante` |
| `tokenConsultantFollowUp` | `per_id = 14` (Carlos Gutiérrez) | `consultante` |
| `wompiEventsSecret` | *(opcional)* `WOMPI_EVENTS_SECRET` del backend | Firma automática del webhook `09.06` |

> **Consejo:** si solo tienes 1 o 2 cuentas de Auth0, puedes correr carpeta por carpeta ajustando el rol del usuario en `person_rol` entre corridas. Para correr todas las carpetas de una sola vez (incluyendo la matriz RBAC `12`), usa los tokens de los roles correspondientes.

---

## Estructura de carpetas

| Carpeta | Alcance y reglas que valida |
| :--- | :--- |
| **00 · Público y Catálogos** | Raíz, `/healthz`, políticas versionadas (`privacy_policy`, `data_treatment` v2.0, `dependent_consent`, `404`), contenido/banners/noticias/galería públicos (ocultando retirados e inactivos), disponibilidad resumida sin exponer psicólogos y validación de `setup_key` en Gmail OAuth. |
| **01 · Autenticación, Identidad y Términos** | `/auth/me` para los 5 roles, `PATCH /auth/terms`, `PATCH /auth/psychologist-terms` y `DELETE /auth/sessions/current`. |
| **02 · Gestión de Usuarios y Perfiles** | Listado y filtros (`active`/`inactive`), ocultación de bloqueados (`404`), validación de dominios (`422`), bloqueo de rol `consultante` (`400`), CRUD completo + cambio de estado + baja lógica (`204`), protección contra baja de psicólogo con citas activas (`409`), y `/users/me` (consultante vs restricción de campos para empleado `403`). |
| **03 · Agenda y Disponibilidad** | Estado y aceptación de `schedule_terms`, validación `INVALID_TIME_RANGE`, creación/solapamiento (`409`)/eliminación de bloques puntuales y recurrentes, bloqueo al borrar regla con citas activas (`409`), calendario y disponibilidad para Secretaría. |
| **04 · Fichas de Consultantes** | Listado, detalle asistido, error `ACCEPTANCE_CHANNEL_REQUIRED`, creación asistida por `whatsapp`, duplicado por documento (`409`), edición, `/consultants/mine` y aislamiento clínico en `/consultants/:id/full` (`200` asignado vs `403` no asignado). |
| **05 · Solicitud y Ciclo de Citas** | Validaciones de edad, términos y vulnerabilidades en dependientes; 1.ª cita pública autoconfirmada, bloqueo de 2.ª cita con franja (`SECRETARY_ASSIGNMENT_REQUIRED`), solicitud pendiente adulto y menor, ocultación de `appReason` para Secretaría, asignación, reasignación, confirmación, descarte, cancelación, vista de consultante y vista clínica del psicólogo. |
| **06 · Remisiones entre Psicólogos** | Bandejas `remitida` y `asignada`, filtro inválido (`400`), bloqueo al asignar a psicólogo distinto (`REFERRED_PSYCHOLOGIST_MISMATCH`), candidatos elegibles anti-bucle en `app_id=21`, bloqueo de autoremisión (`400`), detección de bucle (`REFERRAL_LOOP_DETECTED`), doble remisión (`409`) y asignación exitosa de remisión `19`. |
| **07 · Paquetes de Atención y Seguimiento** | Listado, sugerencias ordenadas por prioridad, validación de límites (`3..12`), bloqueo sobre cita remitida (`409`), sugerencia + rechazo, aprobación con ajuste de sesiones, creación directa desde valoración remitida, reserva y cancelación de sesión por consultante, cierre/cancelación por secretaría y valoración de seguimiento tras paquete finalizado (`cp_id=3`) + bloqueo por valoración ya en curso (`409`). |
| **08 · Notas Clínicas y Aislamiento** | Validación de términos clínicos, cita no realizada (`400`), psicólogo no tratante (`403`), registro de atención (`201`), consulta por cita/ID/auditoría, historial de consultante con aislamiento respecto a Psy 9 y bloqueo de lectura cruzada (`403`). |
| **09 · Donaciones Wompi** | Validación de términos, monto entero en pesos y mínimo (`$1.000 COP`), checkout, firma inválida (`401`), evento firmado automáticamente con `CryptoJS.SHA256` (idempotente) y listado/consulta administrativa. |
| **10 · CMS Institucional** | Misión/visión, tarjetas (`values`, `team` con `teamGroup`/redes/recorte, bloqueo `TEAM_FIELDS_NOT_ALLOWED`), banners (borrador, error activar sin imagen, error eliminar activo `409`), noticias (crear, editar, fijar, retirar antes de eliminar), galería y firma Cloudinary. |
| **11 · Reportes y Logs de Seguridad** | Los 5 reportes (`/reports/general`, `appointments-evolution`, `attendance`, `donations-history`, `donations-evolution`) con presets (`last_7_days`, `last_month`, `last_3_months`, `custom`) verificando métricas no vacías y los 5 rangos de aporte, más `/security-logs`. |
| **12 · Matriz de Seguridad** | Falta de `Origin` (`403`), falta de JWT (`401`), JWT inválido (`401`) y 7 pruebas cruzadas de `403 Forbidden` entre `marketing`, `secretario`, `psicologo` y `consultante`. |

---

## Notas sobre re-ejecución

- La mayoría de las peticiones crean y limpian sus propios recursos usando un sufijo único (`runSuffix`) generado en `00.01`.
- Las carpetas `06`, `07` y `08` modifican de forma controlada algunos registros sembrados para probar transiciones reales de estado (`app_id = 19`, `cp_id = 2`, `app_id = 33`, `cp_id = 3`). Si deseas volver a correr la batería completa desde cero con el estado inicial exacto, recarga [seed-test-battery.sql](../../../DataBase/seeds/seed-test-battery.sql) (descomentando el bloque `TRUNCATE` al inicio del archivo en tu BD de pruebas).
