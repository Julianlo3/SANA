-- =============================================================================
-- SANA - Batería de Datos Artificiales para Pruebas Integrales de Flujos
-- =============================================================================
-- Compatible 100% con el esquema de producción:
--   DataBase/init-scripts/01-schema-neon-new.sql
--
-- Objetivo:
--   Poblar las 29 tablas del esquema con datos sintéticos coherentes con el
--   contexto de la Fundación Dejando Huellas Felices (Campoalegre, Huila) y
--   todas las reglas de negocio de BackEnd y FrontEnd, permitiendo ejecutar una
--   batería de pruebas completa sobre:
--     1. Autenticación Auth0, reclamación de cuentas, estados (activo, inactivo,
--        bloqueado, pendiente) y aceptación obligatoria de términos.
--     2. Gestión de usuarios (CRUD, multi-rol, baja lógica, reactivación) y
--        gestión de fichas de consultantes (web y canales asistidos: teléfono,
--        WhatsApp, presencial).
--     3. Agenda de psicólogos (bloques recurrentes, bloques puntuales,
--        ocupación por citas y bloqueos manuales, puerta de schedule_terms).
--     4. Flujo completo de solicitudes y citas (adultos y menores con los 4
--        parentescos, presencial solo en Huila / virtual en todo el país,
--        todos los estados: pendiente, remitida, asignada, confirmada,
--        descartada, cancelada, realizada, no_asistio, historial de
--        asignación/reasignación y citas personales de personal interno).
--     5. Flujo de remisiones entre psicólogos (remitida pendiente, remitida
--        asignada, remitida realizada y prevención de ciclos).
--     6. Paquetes de atención (sugerido, activo, rechazado, finalizado,
--        cancelado; límites 3-12 sesiones; prioridades alta/media/baja;
--        contador de inasistencias; elegibilidad para valoración de seguimiento).
--     7. Notas clínicas, auditoría (create/view), aceptación de política
--        clinical_note_terms y aislamiento entre psicólogos.
--     8. Donaciones Wompi, tabla donors + trigger trg_donation_update_donor_total,
--        métodos de pago activos/inactivos, los 5 estados y los 5 rangos de
--        monto en COP distribuidos en periodo actual y periodo anterior.
--     9. Contenido institucional CMS (misión/visión, tarjetas de valores,
--        equipo staff/professional con redes y recorte, servicios, programas,
--        banners activos/borrador, noticias fijada/publicadas/retirada,
--        galería publicada/retirada e historial content_change_log).
--    10. Reportes gerenciales, evolución de citas, asistencia, donaciones y
--        bitácora de seguridad (security_access_log) y email_outbox (enviados).
--
-- NOTA SOBRE FECHAS:
--   Todas las fechas operativas son relativas a CURRENT_DATE y
--   date_trunc('week', CURRENT_DATE) en zona horaria 'America/Bogota' para que
--   los reportes (últimos 7 días, último mes, últimos 3 meses y comparativos)
--   y la agenda futura sean válidos sin importar qué día se ejecute el script.
--
-- PRECAUCIÓN:
--   Ejecutar únicamente sobre una base de datos de PRUEBAS/STAGING inicializada
--   con 01-schema-neon-new.sql. NO ejecutar sobre datos reales de producción.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- (OPCIONAL) Descomentar SOLO si se desea limpiar una BD de pruebas antes de
-- recargar este script desde cero:
-- -----------------------------------------------------------------------------
-- TRUNCATE TABLE
--     public.clinical_notes_audit,
--     public.policy_acceptance,
--     public.clinical_notes,
--     public.schedule_occupancy,
--     public.appointment_assignment_history,
--     public.appointments,
--     public.care_packages,
--     public.schedule,
--     public.schedule_recurring_blocks,
--     public.requester_dependent,
--     public.dependents,
--     public.psychologist,
--     public.person_rol,
--     public.content_change_log,
--     public.content_items,
--     public.content_cards,
--     public.banners,
--     public.news,
--     public.gallery_images,
--     public.donation,
--     public.donors,
--     public.email_outbox,
--     public.security_access_log,
--     public.users,
--     public.person
-- RESTART IDENTITY CASCADE;

-- =============================================================================
-- 1. CATÁLOGOS BASE (rol, relationship, payment_method)
-- =============================================================================

INSERT INTO public.rol (rol_id, rol_description)
VALUES
    (1, 'secretario'),
    (2, 'marketing'),
    (3, 'consultante'),
    (4, 'administrador'),
    (5, 'psicologo')
ON CONFLICT (rol_id) DO UPDATE
SET rol_description = EXCLUDED.rol_description;

INSERT INTO public.relationship (rel_id, rel_description)
VALUES
    (1, 'madre'),
    (2, 'padre'),
    (3, 'tio/a'),
    (4, 'abuelo/a')
ON CONFLICT (rel_id) DO UPDATE
SET rel_description = EXCLUDED.rel_description;

INSERT INTO public.payment_method (pmet_id, pmet_is_active, pmet_name)
VALUES
    (1, true,  'CARD'),
    (2, true,  'PSE'),
    (3, true,  'NEQUI'),
    (4, true,  'BANCOLOMBIA_TRANSFER'),
    (5, false, 'EFECTY')
ON CONFLICT (pmet_id) DO UPDATE
SET pmet_is_active = EXCLUDED.pmet_is_active,
    pmet_name      = EXCLUDED.pmet_name;

-- =============================================================================
-- 2. DOCUMENTOS LEGALES Y POLÍTICAS VERSIONADAS (policy_documents)
-- =============================================================================
-- Garantiza existencia de versiones históricas (1.0) y vigentes (2.0 donde
-- aplica) con pd_effective_from estrictamente ordenado. Compatible tanto con
-- una BD vacía como con una donde ya se corrió 02-inserts / 06-legal-v1-texts.

INSERT INTO public.policy_documents (pd_type, pd_version, pd_content, pd_effective_from)
VALUES
    (
        'privacy_policy', '1.0',
        '# Política de Tratamiento de Datos Personales — Fundación Dejando Huellas Felices (NIT 901391294-3, Campoalegre, Huila). Cumplimiento Ley 1581 de 2012, Ley 1098 de 2006 y Ley 1090 de 2006.',
        now() - interval '180 days'
    ),
    (
        'terms_of_use', '1.0',
        '# Términos y condiciones de uso de SANA — Fundación Dejando Huellas Felices. SANA no es un servicio de emergencias (Línea 123 / Línea 141 ICBF).',
        now() - interval '180 days'
    ),
    (
        'account_terms', '1.0',
        'Acepto los Términos y condiciones de uso de SANA y autorizo el uso de mis datos de inicio de sesión para gestionar mi cuenta y mis citas, según la Política de Tratamiento de Datos Personales.',
        now() - interval '180 days'
    ),
    (
        'donation_terms', '1.0',
        'Acepto las condiciones de donación de los Términos y condiciones y autorizo el tratamiento de mis datos según la Política de Tratamiento de Datos Personales.',
        now() - interval '180 days'
    ),
    (
        'data_treatment', '1.0',
        'Versión 1.0 histórica de autorización de tratamiento de datos personales de la Fundación Dejando Huellas Felices.',
        now() - interval '240 days'
    ),
    (
        'data_treatment', '2.0',
        'Soy mayor de edad y autorizo de forma previa, expresa e informada a la Fundación Dejando Huellas Felices para tratar mis datos personales, incluidos los datos sensibles que decida entregar, según la Política de Tratamiento de Datos Personales, que leí y acepto.',
        now() - interval '120 days'
    ),
    (
        'dependent_consent', '1.0',
        'Versión 1.0 histórica de autorización de representante legal para el tratamiento de datos personales de menores de edad.',
        now() - interval '240 days'
    ),
    (
        'dependent_consent', '2.0',
        'Como representante del menor, autorizo de forma previa, expresa e informada a la Fundación Dejando Huellas Felices para tratar sus datos personales y los datos sensibles que decida entregar, para gestionar su cita y su atención psicológica.',
        now() - interval '120 days'
    ),
    (
        'schedule_terms', '1.0',
        'Versión 1.0 histórica de términos de disponibilidad y trazabilidad de agenda para profesionales.',
        now() - interval '240 days'
    ),
    (
        'schedule_terms', '2.0',
        'Como profesional de la Fundación Dejando Huellas Felices, autorizo el tratamiento de mis datos personales y profesionales para administrar la agenda y me comprometo a mantener la confidencialidad y el secreto profesional.',
        now() - interval '120 days'
    ),
    (
        'clinical_note_terms', '1.0',
        'Versión 1.0 histórica de términos de registro y auditoría de notas clínicas.',
        now() - interval '240 days'
    ),
    (
        'clinical_note_terms', '2.0',
        'Confirmo que esta nota corresponde a una atención que realicé, que incluye solo información pertinente para la continuidad del proceso y que la mantendré bajo reserva conforme a la Ley 1090 de 2006.',
        now() - interval '120 days'
    )
ON CONFLICT (pd_type, pd_version) DO NOTHING;

-- =============================================================================
-- 3. PERSONAS, CUENTAS AUTH0, ROLES Y PSICÓLOGOS
--    (person, users, person_rol, psychologist)
-- =============================================================================
-- Nota: Se inserta primero el administrador raíz (per_id = 1) y su fila en
-- users para satisfacer la FK person.per_created_by -> users.use_id.

INSERT INTO public.person (
    per_id, per_name, per_identity_document, per_email, per_contact_number,
    per_state, per_update_date, per_created_by, per_created_at,
    per_birthdate, per_gender, per_card_type,
    per_municipality, per_department, per_residence_zone, per_vulnerabilities
)
VALUES (
    1, 'Rosse Mary Gómez Trujillo', 55102340, 'admin.sana@fundacionhuellitas.org', 3209722813,
    'activo', NULL, NULL, now() - interval '150 days',
    DATE '1982-04-12', 'F', 'CC',
    'Campoalegre', 'Huila', 'Campoalegre, Huila', NULL
);

INSERT INTO public.users (use_id, user_provider_id, user_provider_name, user_last_login_at, user_email_verified)
VALUES (1, 'google-oauth2|100000000000000000001', 'google-oauth2', now() - interval '1 hour', true);

-- Resto del personal (IDs 2-12) y consultantes (IDs 13-24)
-- Fechas de creación escalonadas en periodo anterior (35-90 días) y actual (1-25 días)
-- para nutrir métricas de nuevos registros y comparativos en el Reporte Gerencial.
INSERT INTO public.person (
    per_id, per_name, per_identity_document, per_email, per_contact_number,
    per_state, per_update_date, per_created_by, per_created_at,
    per_birthdate, per_gender, per_card_type,
    per_municipality, per_department, per_residence_zone, per_vulnerabilities
)
VALUES
    -- Personal interno (IDs 2-12)
    (
        2, 'Camila Andrea Rojas Muñoz', 1075284910, 'secretaria1.sana@fundacionhuellitas.org', 3114502201,
        'activo', NULL, 1, now() - interval '140 days',
        DATE '1994-08-19', 'F', 'CC',
        'Campoalegre', 'Huila', 'Campoalegre, Huila', NULL
    ),
    (
        3, 'Daniela Fernanda Vargas Quintero', 1075301122, 'secretaria2.sana@fundacionhuellitas.org', 3128894410,
        'activo', now() - interval '10 days', 1, now() - interval '130 days',
        DATE '1996-02-05', 'F', 'CC',
        'Neiva', 'Huila', 'Neiva, Huila', NULL
    ),
    (
        4, 'Santiago José Morales Perdomo', 1075298845, 'marketing.sana@fundacionhuellitas.org', 3142239981,
        'activo', NULL, 1, now() - interval '130 days',
        DATE '1995-11-23', 'M', 'CC',
        'Neiva', 'Huila', 'Neiva, Huila', NULL
    ),
    (
        5, 'Laura Sofía Hernández Castro', 1075219034, 'psicologa.laura@fundacionhuellitas.org', 3156027741,
        'activo', NULL, 1, now() - interval '135 days',
        DATE '1989-06-14', 'F', 'CC',
        'Campoalegre', 'Huila', 'Campoalegre, Huila', NULL
    ),
    (
        6, 'Andrés Felipe Ramírez Tovar', 1075245612, 'psicologo.andres@fundacionhuellitas.org', 3167741290,
        'activo', NULL, 1, now() - interval '135 days',
        DATE '1987-09-30', 'M', 'CC',
        'Neiva', 'Huila', 'Neiva, Huila', NULL
    ),
    (
        7, 'Mariana Isabel Trujillo Ortiz', 1075267891, 'psicologa.mariana@fundacionhuellitas.org', 3179083321,
        'activo', NULL, 1, now() - interval '125 days',
        DATE '1991-01-27', 'F', 'CC',
        'Campoalegre', 'Huila', 'Campoalegre, Huila', NULL
    ),
    (
        8, 'Sebastián Camilo Ospina Lugo', 1075312044, 'psicologo.nuevo@fundacionhuellitas.org', 3183304590,
        'activo', NULL, 1, now() - interval '8 days',
        DATE '1993-07-08', 'M', 'CC',
        'Neiva', 'Huila', 'Neiva, Huila', NULL
    ),
    (
        9, 'Paula Andrea Cabrera Solano', 55189432, 'psicologa.inactiva@fundacionhuellitas.org', 3102219087,
        'inactivo', now() - interval '30 days', 1, now() - interval '145 days',
        DATE '1985-03-11', 'F', 'CC',
        'Neiva', 'Huila', 'Neiva, Huila', NULL
    ),
    (
        10, 'Jorge Eduardo Medina Pastrana', 77194025, 'ex.secretario@fundacionhuellitas.org', 3135567801,
        'bloqueado', now() - interval '25 days', 1, now() - interval '145 days',
        DATE '1986-12-03', 'M', 'CC',
        'Campoalegre', 'Huila', 'Campoalegre, Huila', NULL
    ),
    (
        11, 'Valentina Torres Polanía', 1075348811, 'marketing.pendiente@fundacionhuellitas.org', 3194421109,
        'activo', NULL, 1, now() - interval '5 days',
        DATE '1998-05-16', 'F', 'CC',
        'Neiva', 'Huila', 'Neiva, Huila', NULL
    ),
    (
        12, 'Mateo Alejandro Silva Bermeo', NULL, 'pendiente.nuevo@example.com', NULL,
        'pendiente', NULL, NULL, now() - interval '3 days',
        NULL, NULL, NULL,
        NULL, NULL, NULL, NULL
    ),

    -- Consultantes (IDs 13-24)
    (
        13, 'María Fernanda López Quintero', 1075601101, 'maria.lopez@example.com', 3201112201,
        'activo', now() - interval '12 days', NULL, now() - interval '55 days',
        DATE '1990-03-21', 'F', 'CC',
        'Campoalegre', 'Huila', 'Campoalegre, Huila', ARRAY['conflict_victim']::varchar(75)[]
    ),
    (
        14, 'Carlos Alberto Gutiérrez Perdomo', 1075601102, 'carlos.gutierrez@example.com', 3201112202,
        'activo', NULL, NULL, now() - interval '58 days',
        DATE '1984-10-09', 'M', 'CC',
        'Neiva', 'Huila', 'Neiva, Huila', ARRAY['none']::varchar(75)[]
    ),
    (
        15, 'Luz Elena Ramírez Cardozo', 36184920, 'luz.ramirez@example.com', 3201112203,
        'activo', NULL, NULL, now() - interval '50 days',
        DATE '1961-07-15', 'F', 'CC',
        'Pitalito', 'Huila', 'Pitalito, Huila', ARRAY['elderly']::varchar(75)[]
    ),
    (
        16, 'Juan David Castañeda Mejía', 1018492011, 'juan.castaneda@example.com', 3201112204,
        'activo', NULL, NULL, now() - interval '18 days',
        DATE '1992-11-04', 'M', 'CE',
        'Bogotá D.C.', 'Cundinamarca', 'Bogotá D.C., Cundinamarca', ARRAY['migrant']::varchar(75)[]
    ),
    (
        17, 'Ana Milena Parra Rojas', 1075601105, 'ana.parra@example.com', 3201112205,
        'activo', NULL, NULL, now() - interval '26 days',
        DATE '1988-02-28', 'F', 'CC',
        'Garzón', 'Huila', 'Garzón, Huila', ARRAY['disability']::varchar(75)[]
    ),
    (
        18, 'Diego Mauricio Sánchez Valderrama', 1075601106, 'diego.sanchez@example.com', 3201112206,
        'activo', NULL, NULL, now() - interval '44 days',
        DATE '1985-08-12', 'M', 'CC',
        'Neiva', 'Huila', 'Neiva, Huila', ARRAY['afro_descendant']::varchar(75)[]
    ),
    (
        19, 'Sofía Alejandra Cortés Bahamón', 1037619204, 'sofia.cortes@example.com', 3201112207,
        'activo', NULL, NULL, now() - interval '46 days',
        DATE '1997-01-19', 'O', 'CC',
        'Medellín', 'Antioquia', 'Medellín, Antioquia', NULL
    ),
    (
        20, 'Pedro Nel Quintero Salazar', 1075601108, 'pedro.quintero@example.com', 3201112208,
        'activo', NULL, NULL, now() - interval '20 days',
        DATE '1979-05-30', 'M', 'CC',
        'Campoalegre', 'Huila', 'Campoalegre, Huila', ARRAY['indigenous']::varchar(75)[]
    ),
    (
        21, 'Carmen Rosa Trujillo Fierro', 1075601109, 'carmen.trujillo@example.com', 3201112209,
        'activo', NULL, NULL, now() - interval '14 days',
        DATE '1983-09-02', 'F', 'CC',
        'Campoalegre', 'Huila', 'Campoalegre, Huila', NULL
    ),
    (
        22, 'Héctor Fabio Calderón Murcia', 1075601110, 'hector.calderon@example.com', 3201112210,
        'activo', NULL, NULL, now() - interval '56 days',
        DATE '1991-12-17', 'M', 'CC',
        'Rivera', 'Huila', 'Rivera, Huila', ARRAY['conflict_victim']::varchar(75)[]
    ),
    (
        23, 'Natalia Gómez Perdomo', 1075601111, 'natalia.gomez@example.com', 3201112211,
        'activo', NULL, NULL, now() - interval '54 days',
        DATE '1995-04-06', 'P', 'CC',
        'Neiva', 'Huila', 'Neiva, Huila', NULL
    ),
    (
        24, 'Luis Fernando Ortiz Chávarro', 1075601112, 'luis.ortiz@example.com', 3201112212,
        'activo', NULL, NULL, now() - interval '19 days',
        DATE '1986-06-25', 'M', 'CC',
        'Palermo', 'Huila', 'Palermo, Huila', NULL
    );

-- Cuentas reclamadas en users (nótese que 11, 12, 20, 21 y 24 NO tienen fila
-- en users a propósito para probar reclamación inicial y consultantes sin cuenta)
INSERT INTO public.users (use_id, user_provider_id, user_provider_name, user_last_login_at, user_email_verified)
VALUES
    (2,  'google-oauth2|100000000000000000002', 'google-oauth2', now() - interval '2 hours',  true),
    (3,  'google-oauth2|100000000000000000003', 'google-oauth2', now() - interval '6 hours',  true),
    (4,  'google-oauth2|100000000000000000004', 'google-oauth2', now() - interval '1 day',    true),
    (5,  'google-oauth2|100000000000000000005', 'google-oauth2', now() - interval '3 hours',  true),
    (6,  'google-oauth2|100000000000000000006', 'google-oauth2', now() - interval '4 hours',  true),
    (7,  'google-oauth2|100000000000000000007', 'google-oauth2', now() - interval '5 hours',  true),
    (8,  'google-oauth2|100000000000000000008', 'google-oauth2', now() - interval '2 days',   true),
    (9,  'google-oauth2|100000000000000000009', 'google-oauth2', now() - interval '32 days',  true),
    (10, 'google-oauth2|100000000000000000010', 'google-oauth2', now() - interval '28 days',  true),
    (13, 'google-oauth2|100000000000000000013', 'google-oauth2', now() - interval '1 day',    true),
    (14, 'google-oauth2|100000000000000000014', 'google-oauth2', now() - interval '2 days',   true),
    (15, 'google-oauth2|100000000000000000015', 'google-oauth2', now() - interval '1 day',    true),
    (16, 'google-oauth2|100000000000000000016', 'google-oauth2', now() - interval '3 days',   true),
    (17, 'google-oauth2|100000000000000000017', 'google-oauth2', now() - interval '2 days',   true),
    (18, 'google-oauth2|100000000000000000018', 'google-oauth2', now() - interval '1 day',    true),
    (19, 'google-oauth2|100000000000000000019', 'google-oauth2', now() - interval '5 days',   true),
    (22, 'google-oauth2|100000000000000000022', 'google-oauth2', now() - interval '2 days',   true),
    (23, 'google-oauth2|100000000000000000023', 'google-oauth2', now() - interval '4 days',   true);

-- Marcar per_created_by = 2 (secretaria principal) en consultantes registrados de forma asistida
UPDATE public.person SET per_created_by = 2 WHERE per_id IN (21, 24);

-- Asignación de roles (person_rol)
INSERT INTO public.person_rol (per_id, rol_id, pr_assigned_at, pr_active)
VALUES
    -- Personal interno
    (1,  4, now() - interval '150 days', true),  -- administrador
    (2,  1, now() - interval '140 days', true),  -- secretario
    (3,  1, now() - interval '130 days', true),  -- secretario
    (3,  3, now() - interval '10 days',  true),  -- también consultante (cita personal)
    (4,  2, now() - interval '130 days', true),  -- marketing
    (5,  5, now() - interval '135 days', true),  -- psicologo
    (6,  5, now() - interval '135 days', true),  -- psicologo
    (7,  5, now() - interval '125 days', true),  -- psicologo
    (8,  5, now() - interval '8 days',   true),  -- psicologo nuevo (sin schedule_terms)
    (9,  5, now() - interval '145 days', true),  -- psicologo (inactivo)
    (9,  4, now() - interval '145 days', false), -- rol administrador desactivado
    (10, 1, now() - interval '145 days', true),  -- ex-secretario (bloqueado -> solo acceso consultante)
    (10, 3, now() - interval '90 days',  true),  -- consultante
    (11, 2, now() - interval '5 days',   true),  -- marketing sin reclamar en Auth0
    -- Consultantes
    (13, 3, now() - interval '55 days', true),
    (14, 3, now() - interval '58 days', true),
    (15, 3, now() - interval '50 days', true),
    (16, 3, now() - interval '18 days', true),
    (17, 3, now() - interval '26 days', true),
    (18, 3, now() - interval '44 days', true),
    (19, 3, now() - interval '46 days', true),
    (20, 3, now() - interval '20 days', true),
    (21, 3, now() - interval '14 days', true),
    (22, 3, now() - interval '56 days', true),
    (23, 3, now() - interval '54 days', true),
    (24, 3, now() - interval '19 days', true);

-- Perfiles profesionales de psicólogos (psychologist)
INSERT INTO public.psychologist (psy_id, psy_license_number, psy_speciality)
VALUES
    (5, 104521, 'Psicología Clínica Infantil y Adolescente'),
    (6, 108934, 'Psicología Clínica de Adultos y Trauma'),
    (7, 112405, 'Terapia Familiar y de Pareja'),
    (8, 119870, 'Psicología Educativa y Orientación'),
    (9, 101290, 'Neuropsicología Clínica');

-- =============================================================================
-- 4. DEPENDIENTES (MENORES DE EDAD) Y PARENTESCOS
--    (dependents, requester_dependent)
-- =============================================================================
-- Todos los dependientes tienen < 18 años y cubren los 4 tipos de parentesco.

INSERT INTO public.dependents (dep_id, dep_identity_document, dep_name, dep_birthdate, dep_gender)
VALUES
    (1, 1190001001, 'Samuel Esteban López Quintero',   DATE '2016-05-14', 'M'),
    (2, 1190001002, 'Valeria Sofía Martínez Ramírez',  DATE '2014-09-22', 'F'),
    (3, 1190001003, 'Matías Alejandro Sánchez Rojas',  DATE '2018-01-30', 'M'),
    (4, 1190001004, 'Salomé Valentina Fierro Pérez',   DATE '2012-11-08', 'F');

INSERT INTO public.requester_dependent (req_id, dep_id, rel_id, rd_assigned_at)
VALUES
    (13, 1, 1, now() - interval '25 days'), -- madre
    (15, 2, 4, now() - interval '48 days'), -- abuelo/a
    (18, 3, 2, now() - interval '10 days'), -- padre
    (21, 4, 3, now() - interval '12 days'); -- tio/a

-- =============================================================================
-- 5. DISPONIBILIDAD DE PSICÓLOGOS (schedule_recurring_blocks, schedule)
-- =============================================================================
-- Bloques recurrentes activos (lunes=1 .. viernes=5) sin solapamientos para
-- los 3 psicólogos operativos (5, 6, 7). Psy 8 no tiene bloques (sin aceptar
-- schedule_terms); Psy 9 (inactivo) solo conserva su bloque histórico puntual.

INSERT INTO public.schedule_recurring_blocks (
    srb_id, psy_id, srb_day_of_week, srb_start_time, srb_end_time,
    srb_valid_from, srb_valid_until, srb_active
)
VALUES
    -- Psy 5: Lunes a Viernes 08:00-12:00 y 14:00-18:00
    (1,  5, 1, TIME '08:00:00', TIME '12:00:00', CURRENT_DATE - 120, NULL, true),
    (2,  5, 1, TIME '14:00:00', TIME '18:00:00', CURRENT_DATE - 120, NULL, true),
    (3,  5, 2, TIME '08:00:00', TIME '12:00:00', CURRENT_DATE - 120, NULL, true),
    (4,  5, 2, TIME '14:00:00', TIME '18:00:00', CURRENT_DATE - 120, NULL, true),
    (5,  5, 3, TIME '08:00:00', TIME '12:00:00', CURRENT_DATE - 120, NULL, true),
    (6,  5, 3, TIME '14:00:00', TIME '18:00:00', CURRENT_DATE - 120, NULL, true),
    (7,  5, 4, TIME '08:00:00', TIME '12:00:00', CURRENT_DATE - 120, NULL, true),
    (8,  5, 4, TIME '14:00:00', TIME '18:00:00', CURRENT_DATE - 120, NULL, true),
    (9,  5, 5, TIME '08:00:00', TIME '12:00:00', CURRENT_DATE - 120, NULL, true),
    (10, 5, 5, TIME '14:00:00', TIME '18:00:00', CURRENT_DATE - 120, NULL, true),

    -- Psy 6: Lunes a Viernes 09:00-13:00 y 14:00-18:00
    (11, 6, 1, TIME '09:00:00', TIME '13:00:00', CURRENT_DATE - 120, NULL, true),
    (12, 6, 1, TIME '14:00:00', TIME '18:00:00', CURRENT_DATE - 120, NULL, true),
    (13, 6, 2, TIME '09:00:00', TIME '13:00:00', CURRENT_DATE - 120, NULL, true),
    (14, 6, 2, TIME '14:00:00', TIME '18:00:00', CURRENT_DATE - 120, NULL, true),
    (15, 6, 3, TIME '09:00:00', TIME '13:00:00', CURRENT_DATE - 120, NULL, true),
    (16, 6, 3, TIME '14:00:00', TIME '18:00:00', CURRENT_DATE - 120, NULL, true),
    (17, 6, 4, TIME '09:00:00', TIME '13:00:00', CURRENT_DATE - 120, NULL, true),
    (18, 6, 4, TIME '14:00:00', TIME '18:00:00', CURRENT_DATE - 120, NULL, true),
    (19, 6, 5, TIME '09:00:00', TIME '13:00:00', CURRENT_DATE - 120, NULL, true),
    (20, 6, 5, TIME '14:00:00', TIME '18:00:00', CURRENT_DATE - 120, NULL, true),

    -- Psy 7: Lunes a Viernes 08:00-12:00 y 13:00-17:00 + 1 regla inactiva vencida (sábado)
    (21, 7, 1, TIME '08:00:00', TIME '12:00:00', CURRENT_DATE - 120, NULL, true),
    (22, 7, 1, TIME '13:00:00', TIME '17:00:00', CURRENT_DATE - 120, NULL, true),
    (23, 7, 2, TIME '08:00:00', TIME '12:00:00', CURRENT_DATE - 120, NULL, true),
    (24, 7, 2, TIME '13:00:00', TIME '17:00:00', CURRENT_DATE - 120, NULL, true),
    (25, 7, 3, TIME '08:00:00', TIME '12:00:00', CURRENT_DATE - 120, NULL, true),
    (26, 7, 3, TIME '13:00:00', TIME '17:00:00', CURRENT_DATE - 120, NULL, true),
    (27, 7, 4, TIME '08:00:00', TIME '12:00:00', CURRENT_DATE - 120, NULL, true),
    (28, 7, 4, TIME '13:00:00', TIME '17:00:00', CURRENT_DATE - 120, NULL, true),
    (29, 7, 5, TIME '08:00:00', TIME '12:00:00', CURRENT_DATE - 120, NULL, true),
    (30, 7, 5, TIME '13:00:00', TIME '17:00:00', CURRENT_DATE - 120, NULL, true),
    (31, 7, 6, TIME '08:00:00', TIME '11:00:00', CURRENT_DATE - 150, CURRENT_DATE - 60, false);

-- Bloques puntuales (schedule): sábados adicionales y respaldo de citas recientes
INSERT INTO public.schedule (sch_id, psy_id, sch_date, sch_start_time, sch_end_time)
VALUES
    (1, 5, (date_trunc('week', CURRENT_DATE)::date + 12), TIME '08:00:00', TIME '12:00:00'), -- próximo sábado
    (2, 6, (date_trunc('week', CURRENT_DATE)::date + 12), TIME '09:00:00', TIME '12:00:00'), -- próximo sábado
    (3, 7, (date_trunc('week', CURRENT_DATE)::date + 19), TIME '08:00:00', TIME '11:00:00'), -- sábado en 2 semanas
    (4, 5, (CURRENT_DATE - 1),                            TIME '08:00:00', TIME '12:00:00'), -- respaldo cita ayer (app 6)
    (5, 6, (CURRENT_DATE - 2),                            TIME '09:00:00', TIME '12:00:00'), -- respaldo cita anteayer (app 21)
    (6, 7, (CURRENT_DATE - 1),                            TIME '08:00:00', TIME '12:00:00'), -- respaldo cita ayer (app 33)
    (7, 9, (date_trunc('week', CURRENT_DATE)::date - 48), TIME '09:00:00', TIME '12:00:00'); -- bloque histórico Psy 9

-- =============================================================================
-- 6. CITAS DE VALORACIÓN (appointments con app_kind = 'valoracion')
-- =============================================================================
-- Se insertan primero las valoraciones (cp_id = NULL) para que care_packages
-- pueda referenciar cp_assessment_app_id en orden topológico limpio.
-- Referencia semanal:
--   W0 = date_trunc('week', CURRENT_DATE)::date (lunes actual)
--   Pasado anterior (periodo previo reportes): W0 - 49, W0 - 42, W0 - 35
--   Pasado reciente (periodo actual reportes): W0 - 21, W0 - 14, W0 - 7, ayer/anteayer
--   Futuro garantizado (> now()):              W0 + 7 (próx. semana), W0 + 14 (+2 sem.)

INSERT INTO public.appointments (
    app_id, psy_id, sec_id, req_id, app_patient_person_id, app_patient_dependent_id,
    app_date, app_state, app_type, app_reason, app_discard_reason,
    app_created_at, app_duration, cp_id, app_kind, app_calendar_event_id,
    app_referred_from_app_id, app_referred_to_psy_id, app_referral_reason
)
VALUES
    -- App 1: Per 13 (adulto, Campoalegre/Huila) — Valoración realizada -> CP 1 (activo)
    (
        1, 6, NULL, 13, 13, NULL,
        (((date_trunc('week', CURRENT_DATE)::date - 42)::timestamp + TIME '09:00:00') AT TIME ZONE 'America/Bogota'),
        'realizada', 'presencial',
        'Ansiedad persistente, alteraciones del sueño y dificultad para retomar rutinas laborales tras desplazamiento.',
        NULL, now() - interval '50 days', 60, NULL, 'valoracion', 'gcal_evt_sana_0001',
        NULL, NULL, NULL
    ),
    -- App 6: Dep 1 (hijo de Per 13, madre) — Valoración realizada ayer -> CP 2 (sugerido)
    (
        6, 5, NULL, 13, NULL, 1,
        (((CURRENT_DATE - 1)::timestamp + TIME '10:00:00') AT TIME ZONE 'America/Bogota'),
        'realizada', 'presencial',
        'Dificultades de atención en el aula, retraimiento con pares y episodios de llanto antes de ir al colegio.',
        NULL, now() - interval '6 days', 60, NULL, 'valoracion', 'gcal_evt_sana_0006',
        NULL, NULL, NULL
    ),
    -- App 7: Per 14 (adulto, Neiva/Huila) — Valoración realizada -> CP 3 (finalizado, elegible a seguimiento)
    (
        7, 6, NULL, 14, 14, NULL,
        (((date_trunc('week', CURRENT_DATE)::date - 47)::timestamp + TIME '14:00:00') AT TIME ZONE 'America/Bogota'),
        'realizada', 'presencial',
        'Estrés laboral prolongado, irritabilidad familiar y agotamiento emocional.',
        NULL, now() - interval '56 days', 60, NULL, 'valoracion', 'gcal_evt_sana_0007',
        NULL, NULL, NULL
    ),
    -- App 12: Dep 2 (nieta de Per 15, abuelo/a) — Valoración realizada -> CP 4 (activo con inasistencia)
    (
        12, 5, NULL, 15, NULL, 2,
        (((date_trunc('week', CURRENT_DATE)::date - 39)::timestamp + TIME '10:00:00') AT TIME ZONE 'America/Bogota'),
        'realizada', 'presencial',
        'Proceso de duelo reciente por pérdida familiar y baja tolerancia a la frustración.',
        NULL, now() - interval '48 days', 60, NULL, 'valoracion', 'gcal_evt_sana_0012',
        NULL, NULL, NULL
    ),
    -- App 17: Per 15 (propia primera cita futura confirmada) — Para probar autocancelación de consultante
    (
        17, 7, NULL, 15, 15, NULL,
        (((date_trunc('week', CURRENT_DATE)::date + 8)::timestamp + TIME '09:00:00') AT TIME ZONE 'America/Bogota'),
        'confirmada', 'presencial',
        'Acompañamiento para manejo del duelo y sobrecarga como cuidadora principal.',
        NULL, now() - interval '3 days', 60, NULL, 'valoracion', 'gcal_evt_sana_0017',
        NULL, NULL, NULL
    ),
    -- App 18: Per 16 (Bogotá -> virtual) — Valoración realizada y REMITIDA de Psy 5 a Psy 6
    (
        18, 5, NULL, 16, 16, NULL,
        (((date_trunc('week', CURRENT_DATE)::date - 5)::timestamp + TIME '15:00:00') AT TIME ZONE 'America/Bogota'),
        'realizada', 'virtual',
        'Síntomas de estrés postraumático y dificultad de adaptación tras migración reciente.',
        NULL, now() - interval '15 days', 60, NULL, 'valoracion', 'gcal_evt_sana_0018',
        NULL, 6, 'Se remite a especialista en adultos y trauma para evaluación focalizada.'
    ),
    -- App 19: Hija de App 18 — En estado 'remitida' esperando asignación por secretaría en /remisiones
    (
        19, 6, NULL, 16, 16, NULL,
        NULL,
        'remitida', 'virtual',
        'Síntomas de estrés postraumático y dificultad de adaptación tras migración reciente.',
        NULL, now() - interval '4 days', NULL, NULL, 'valoracion', NULL,
        18, NULL, 'Se remite a especialista en adultos y trauma para evaluación focalizada.'
    ),
    -- App 20: Per 17 (Garzón/Huila) — Valoración inicial con Psy 5, REMITIDA a Psy 6
    (
        20, 5, NULL, 17, 17, NULL,
        (((date_trunc('week', CURRENT_DATE)::date - 17)::timestamp + TIME '09:00:00') AT TIME ZONE 'America/Bogota'),
        'realizada', 'presencial',
        'Episodios depresivos recurrentes asociados a proceso de rehabilitación física.',
        NULL, now() - interval '25 days', 60, NULL, 'valoracion', 'gcal_evt_sana_0020',
        NULL, 6, 'Requiere abordaje clínico en adultos; se remite al Dr. Andrés Ramírez.'
    ),
    -- App 21: Hija de App 20 — Valoración remitida ya realizada con Psy 6 (lista para sugerir paquete o probar anti-bucle)
    (
        21, 6, 2, 17, 17, NULL,
        (((CURRENT_DATE - 2)::timestamp + TIME '10:00:00') AT TIME ZONE 'America/Bogota'),
        'realizada', 'presencial',
        'Episodios depresivos recurrentes asociados a proceso de rehabilitación física.',
        NULL, now() - interval '16 days', 60, NULL, 'valoracion', 'gcal_evt_sana_0021',
        20, NULL, 'Requiere abordaje clínico en adultos; se remite al Dr. Andrés Ramírez.'
    ),
    -- App 22: Per 18 (Neiva/Huila) — Valoración realizada -> CP 5 (rechazado)
    (
        22, 7, 2, 18, 18, NULL,
        (((date_trunc('week', CURRENT_DATE)::date - 35)::timestamp + TIME '15:00:00') AT TIME ZONE 'America/Bogota'),
        'realizada', 'presencial',
        'Conflictos de comunicación en pareja y manejo de la ira.',
        NULL, now() - interval '42 days', 60, NULL, 'valoracion', 'gcal_evt_sana_0022',
        NULL, NULL, NULL
    ),
    -- App 23: Per 18 — Nueva solicitud en estado 'pendiente' (sin fecha ni psicólogo, lista para gestión de secretaría)
    (
        23, NULL, NULL, 18, 18, NULL,
        NULL,
        'pendiente', 'virtual',
        'Solicito retomar orientación psicológica en modalidad virtual por cambio de horario laboral.',
        NULL, now() - interval '2 days', NULL, NULL, 'valoracion', NULL,
        NULL, NULL, NULL
    ),
    -- App 24: Dep 3 (hijo de Per 18, padre) — En estado 'asignada' (provisional, reasignada de Psy 5 a Psy 7)
    (
        24, 7, 2, 18, NULL, 3,
        (((date_trunc('week', CURRENT_DATE)::date + 9)::timestamp + TIME '14:00:00') AT TIME ZONE 'America/Bogota'),
        'asignada', 'presencial',
        'Acompañamiento infantil por separación reciente de los padres y dificultades para dormir.',
        NULL, now() - interval '5 days', 60, NULL, 'valoracion', NULL,
        NULL, NULL, NULL
    ),
    -- App 25: Per 19 (Medellín -> virtual) — Valoración realizada -> CP 6 (cancelado)
    (
        25, 7, NULL, 19, 19, NULL,
        (((date_trunc('week', CURRENT_DATE)::date - 38)::timestamp + TIME '10:00:00') AT TIME ZONE 'America/Bogota'),
        'realizada', 'virtual',
        'Orientación por ansiedad académica y toma de decisiones vocacionales.',
        NULL, now() - interval '45 days', 60, NULL, 'valoracion', 'gcal_evt_sana_0025',
        NULL, NULL, NULL
    ),
    -- App 28: Per 19 — Solicitud descartada por secretaría
    (
        28, NULL, 2, 19, 19, NULL,
        NULL,
        'descartada', 'virtual',
        'Solicitud repetida enviada por error desde el formulario.',
        'Solicitud duplicada confirmada telefónicamente con la consultante.',
        now() - interval '12 days', NULL, NULL, 'valoracion', NULL,
        NULL, NULL, NULL
    ),
    -- App 29: Per 20 (consultante sin cuenta Auth0) — Valoración en estado 'no_asistio'
    (
        29, 6, NULL, 20, 20, NULL,
        (((date_trunc('week', CURRENT_DATE)::date - 10)::timestamp + TIME '11:00:00') AT TIME ZONE 'America/Bogota'),
        'no_asistio', 'presencial',
        'Acompañamiento psicosocial comunitario y manejo del estrés.',
        NULL, now() - interval '18 days', 60, NULL, 'valoracion', NULL,
        NULL, NULL, NULL
    ),
    -- App 30: Per 20 — Nueva solicitud 'pendiente'
    (
        30, NULL, NULL, 20, 20, NULL,
        NULL,
        'pendiente', 'presencial',
        'Solicito reprogramación de valoración inicial; no pude asistir por calamidad familiar.',
        NULL, now() - interval '1 day', NULL, NULL, 'valoracion', NULL,
        NULL, NULL, NULL
    ),
    -- App 31: Dep 4 (sobrina de Per 21, tio/a) — Valoración futura confirmada con Psy 5
    (
        31, 5, 2, 21, NULL, 4,
        (((date_trunc('week', CURRENT_DATE)::date + 11)::timestamp + TIME '09:00:00') AT TIME ZONE 'America/Bogota'),
        'confirmada', 'presencial',
        'Evaluación adolescente por ansiedad social y descenso en rendimiento escolar.',
        NULL, now() - interval '8 days', 60, NULL, 'valoracion', 'gcal_evt_sana_0031',
        NULL, NULL, NULL
    ),
    -- App 32: Per 22 — Valoración histórica realizada con Psy 9 (inactiva) para historial y aislamiento
    (
        32, 9, 2, 22, 22, NULL,
        (((date_trunc('week', CURRENT_DATE)::date - 48)::timestamp + TIME '10:00:00') AT TIME ZONE 'America/Bogota'),
        'realizada', 'presencial',
        'Evaluación inicial de memoria y atención tras cuadro de estrés severo.',
        NULL, now() - interval '54 days', 60, NULL, 'valoracion', NULL,
        NULL, NULL, NULL
    ),
    -- App 33: Per 22 — Valoración realizada ayer con Psy 7 SIN nota clínica ni paquete aún (lista para probar registro de atención y sugerencia)
    (
        33, 7, 2, 22, 22, NULL,
        (((CURRENT_DATE - 1)::timestamp + TIME '09:00:00') AT TIME ZONE 'America/Bogota'),
        'realizada', 'presencial',
        'Seguimiento familiar y herramientas de regulación emocional.',
        NULL, now() - interval '9 days', 60, NULL, 'valoracion', 'gcal_evt_sana_0033',
        NULL, NULL, NULL
    ),
    -- App 34: Per 23 (sin términos de cuenta aceptados) — Valoración realizada -> CP 7 (finalizado)
    (
        34, 7, NULL, 23, 23, NULL,
        (((date_trunc('week', CURRENT_DATE)::date - 46)::timestamp + TIME '15:00:00') AT TIME ZONE 'America/Bogota'),
        'realizada', 'presencial',
        'Orientación psicológica para fortalecimiento de autoestima y límites familiares.',
        NULL, now() - interval '52 days', 60, NULL, 'valoracion', 'gcal_evt_sana_0034',
        NULL, NULL, NULL
    ),
    -- App 38: Per 23 — Valoración de seguimiento futura confirmada con su psicóloga tratante (Psy 7) tras finalizar CP 7
    (
        38, 7, NULL, 23, 23, NULL,
        (((date_trunc('week', CURRENT_DATE)::date + 15)::timestamp + TIME '15:00:00') AT TIME ZONE 'America/Bogota'),
        'confirmada', 'presencial',
        'Valoración de seguimiento posterior al cierre del primer paquete de atención.',
        NULL, now() - interval '3 days', 60, NULL, 'valoracion', 'gcal_evt_sana_0038',
        NULL, NULL, NULL
    ),
    -- App 39: Per 24 (Palermo/Huila, registro asistido WhatsApp) — Valoración realizada y REMITIDA de Psy 6 a Psy 7
    (
        39, 6, 2, 24, 24, NULL,
        (((date_trunc('week', CURRENT_DATE)::date - 13)::timestamp + TIME '16:00:00') AT TIME ZONE 'America/Bogota'),
        'realizada', 'presencial',
        'Dificultades de convivencia familiar y comunicación con hijos adolescentes.',
        NULL, now() - interval '18 days', 60, NULL, 'valoracion', 'gcal_evt_sana_0039',
        NULL, 7, 'Caso enfocado en dinámica familiar; se remite a especialista en Terapia Familiar.'
    ),
    -- App 40: Hija de App 39 — Remisión en estado 'asignada' (puebla pestaña asignadas de /remisiones)
    (
        40, 7, 2, 24, 24, NULL,
        (((date_trunc('week', CURRENT_DATE)::date + 16)::timestamp + TIME '10:00:00') AT TIME ZONE 'America/Bogota'),
        'asignada', 'presencial',
        'Dificultades de convivencia familiar y comunicación con hijos adolescentes.',
        NULL, now() - interval '12 days', 60, NULL, 'valoracion', NULL,
        39, NULL, 'Caso enfocado en dinámica familiar; se remite a especialista en Terapia Familiar.'
    ),
    -- App 41: Per 3 (secretaria2 como consultante personal) — Gestionada por Per 2 (secretaria1) y atendida por Psy 6
    (
        41, 6, 2, 3, 3, NULL,
        (((date_trunc('week', CURRENT_DATE)::date + 14)::timestamp + TIME '11:00:00') AT TIME ZONE 'America/Bogota'),
        'confirmada', 'presencial',
        'Manejo de estrés laboral y prevención de desgaste profesional.',
        NULL, now() - interval '4 days', 60, NULL, 'valoracion', 'gcal_evt_sana_0041',
        NULL, NULL, NULL
    );

-- =============================================================================
-- 7. PAQUETES DE ATENCIÓN (care_packages)
-- =============================================================================
-- Reglas verificadas:
--   - cp_session_limit entre 3 y 12 (MIN_CARE_PACKAGE_SESSIONS..MAX_CARE_PACKAGE_SESSIONS)
--   - Máximo 1 paquete 'activo' por persona o por dependiente
--   - Cubre los 5 estados: sugerido, activo, rechazado, finalizado, cancelado
--   - Cubre las 3 prioridades: alta, media, baja

INSERT INTO public.care_packages (
    cp_id, cp_patient_person_id, cp_patient_dependent_id, cp_assessment_app_id,
    psy_id, sec_id, cp_session_limit, cp_priority, cp_state,
    cp_created_at, cp_closed_at, cp_closed_by, cp_close_reason,
    cp_reviewed_at, cp_suggestion_comment, cp_rejection_reason,
    cp_suggested_session_limit, cp_suggested_priority
)
VALUES
    -- CP 1: ACTIVO (Per 13 - adulto, prioridad alta). Psicólogo sugirió 8 sesiones, secretaría aprobó 6.
    (
        1, 13, NULL, 1,
        6, 2, 6, 'alta', 'activo',
        now() - interval '41 days', NULL, NULL, NULL,
        now() - interval '40 days',
        'Se recomienda proceso cognitivo-conductual para manejo de ansiedad y regulación del sueño.',
        NULL, 8, 'alta'
    ),
    -- CP 2: SUGERIDO (Dep 1 - menor, prioridad alta). Pendiente de aprobación/rechazo en /paquetes.
    (
        2, NULL, 1, 6,
        5, NULL, 6, 'alta', 'sugerido',
        now() - interval '1 day', NULL, NULL, NULL,
        NULL,
        'Requiere intervención infantil semanal y sesiones de psicoeducación con la madre.',
        NULL, 6, 'alta'
    ),
    -- CP 3: FINALIZADO (Per 14 - adulto, prioridad media, 4/4 sesiones realizadas). Elegible para nueva valoración de seguimiento.
    (
        3, 14, NULL, 7,
        6, 2, 4, 'media', 'finalizado',
        now() - interval '46 days', now() - interval '11 days', NULL,
        'Completadas todas las sesiones del paquete',
        now() - interval '45 days',
        'Plan breve de manejo de estrés laboral y técnicas de afrontamiento.',
        NULL, 4, 'media'
    ),
    -- CP 4: ACTIVO (Dep 2 - menor, prioridad media, 5 sesiones: 2 realizadas + 1 confirmada + 1 inasistencia = 2 cupos libres).
    (
        4, NULL, 2, 12,
        5, 2, 5, 'media', 'activo',
        now() - interval '38 days', NULL, NULL, NULL,
        now() - interval '37 days',
        'Acompañamiento emocional infantil por duelo con seguimiento a red de apoyo familiar.',
        NULL, 5, 'media'
    ),
    -- CP 5: RECHAZADO (Per 18 - adulto, prioridad baja).
    (
        5, 18, NULL, 22,
        7, 2, 4, 'baja', 'rechazado',
        now() - interval '34 days', NULL, NULL, NULL,
        now() - interval '33 days',
        'Se sugiere ciclo corto de orientación en comunicación asertiva.',
        'El consultante informó imposibilidad temporal de asistir en horario presencial; se orienta a solicitar nueva valoración virtual.',
        4, 'baja'
    ),
    -- CP 6: CANCELADO (Per 19 - adulto virtual, prioridad baja). Cerrado anticipadamente por secretaría.
    (
        6, 19, NULL, 25,
        7, 2, 8, 'baja', 'cancelado',
        now() - interval '37 days', now() - interval '16 days', 2,
        'Cierre solicitado por la consultante por viaje prolongado fuera del país.',
        now() - interval '36 days',
        'Proceso de acompañamiento virtual en ansiedad académica y proyecto de vida.',
        NULL, 8, 'baja'
    ),
    -- CP 7: FINALIZADO (Per 23 - adulto, prioridad media, 3/3 sesiones realizadas; ya tiene valoración de seguimiento App 38).
    (
        7, 23, NULL, 34,
        7, 2, 3, 'media', 'finalizado',
        now() - interval '45 days', now() - interval '10 days', NULL,
        'Completadas todas las sesiones del paquete',
        now() - interval '44 days',
        'Ciclo focalizado de 3 sesiones en autoestima y establecimiento de límites.',
        NULL, 3, 'media'
    );

-- =============================================================================
-- 8. CITAS DE PAQUETE (appointments con app_kind = 'paquete')
-- =============================================================================

INSERT INTO public.appointments (
    app_id, psy_id, sec_id, req_id, app_patient_person_id, app_patient_dependent_id,
    app_date, app_state, app_type, app_reason, app_discard_reason,
    app_created_at, app_duration, cp_id, app_kind, app_calendar_event_id,
    app_referred_from_app_id, app_referred_to_psy_id, app_referral_reason
)
VALUES
    -- Sesiones de CP 1 (Per 13, Psy 6, límite 6: 2 realizadas, 1 confirmada, 1 cancelada -> 3 disponibles)
    (
        2, 6, 2, 13, 13, NULL,
        (((date_trunc('week', CURRENT_DATE)::date - 21)::timestamp + TIME '10:00:00') AT TIME ZONE 'America/Bogota'),
        'realizada', 'presencial', NULL, NULL,
        now() - interval '28 days', 60, 1, 'paquete', 'gcal_evt_sana_0002', NULL, NULL, NULL
    ),
    (
        3, 6, NULL, 13, 13, NULL,
        (((date_trunc('week', CURRENT_DATE)::date - 14)::timestamp + TIME '10:00:00') AT TIME ZONE 'America/Bogota'),
        'realizada', 'presencial', NULL, NULL,
        now() - interval '20 days', 60, 1, 'paquete', 'gcal_evt_sana_0003', NULL, NULL, NULL
    ),
    (
        4, 6, NULL, 13, 13, NULL,
        (((date_trunc('week', CURRENT_DATE)::date - 7)::timestamp + TIME '10:00:00') AT TIME ZONE 'America/Bogota'),
        'cancelada', 'presencial', NULL, NULL,
        now() - interval '13 days', 60, 1, 'paquete', NULL, NULL, NULL, NULL
    ),
    (
        5, 6, NULL, 13, 13, NULL,
        (((date_trunc('week', CURRENT_DATE)::date + 7)::timestamp + TIME '10:00:00') AT TIME ZONE 'America/Bogota'),
        'confirmada', 'presencial', NULL, NULL,
        now() - interval '3 days', 60, 1, 'paquete', 'gcal_evt_sana_0005', NULL, NULL, NULL
    ),

    -- Sesiones de CP 3 (Per 14, Psy 6, límite 4: 4/4 realizadas -> finalizado)
    (
        8, 6, NULL, 14, 14, NULL,
        (((date_trunc('week', CURRENT_DATE)::date - 40)::timestamp + TIME '14:00:00') AT TIME ZONE 'America/Bogota'),
        'realizada', 'presencial', NULL, NULL,
        now() - interval '44 days', 60, 3, 'paquete', 'gcal_evt_sana_0008', NULL, NULL, NULL
    ),
    (
        9, 6, NULL, 14, 14, NULL,
        (((date_trunc('week', CURRENT_DATE)::date - 33)::timestamp + TIME '14:00:00') AT TIME ZONE 'America/Bogota'),
        'realizada', 'presencial', NULL, NULL,
        now() - interval '38 days', 60, 3, 'paquete', 'gcal_evt_sana_0009', NULL, NULL, NULL
    ),
    (
        10, 6, NULL, 14, 14, NULL,
        (((date_trunc('week', CURRENT_DATE)::date - 19)::timestamp + TIME '14:00:00') AT TIME ZONE 'America/Bogota'),
        'realizada', 'presencial', NULL, NULL,
        now() - interval '26 days', 60, 3, 'paquete', 'gcal_evt_sana_0010', NULL, NULL, NULL
    ),
    (
        11, 6, NULL, 14, 14, NULL,
        (((date_trunc('week', CURRENT_DATE)::date - 12)::timestamp + TIME '14:00:00') AT TIME ZONE 'America/Bogota'),
        'realizada', 'presencial', NULL, NULL,
        now() - interval '18 days', 60, 3, 'paquete', 'gcal_evt_sana_0011', NULL, NULL, NULL
    ),

    -- Sesiones de CP 4 (Dep 2 / Per 15, Psy 5, límite 5: 2 realizadas, 1 no_asistio, 1 confirmada -> 2 disponibles)
    (
        13, 5, 2, 15, NULL, 2,
        (((date_trunc('week', CURRENT_DATE)::date - 32)::timestamp + TIME '10:00:00') AT TIME ZONE 'America/Bogota'),
        'realizada', 'presencial', NULL, NULL,
        now() - interval '36 days', 60, 4, 'paquete', 'gcal_evt_sana_0013', NULL, NULL, NULL
    ),
    (
        14, 5, NULL, 15, NULL, 2,
        (((date_trunc('week', CURRENT_DATE)::date - 18)::timestamp + TIME '10:00:00') AT TIME ZONE 'America/Bogota'),
        'no_asistio', 'presencial', NULL, NULL,
        now() - interval '25 days', 60, 4, 'paquete', NULL, NULL, NULL, NULL
    ),
    (
        15, 5, NULL, 15, NULL, 2,
        (((date_trunc('week', CURRENT_DATE)::date - 4)::timestamp + TIME '10:00:00') AT TIME ZONE 'America/Bogota'),
        'realizada', 'presencial', NULL, NULL,
        now() - interval '11 days', 60, 4, 'paquete', 'gcal_evt_sana_0015', NULL, NULL, NULL
    ),
    (
        16, 5, NULL, 15, NULL, 2,
        (((date_trunc('week', CURRENT_DATE)::date + 10)::timestamp + TIME '10:00:00') AT TIME ZONE 'America/Bogota'),
        'confirmada', 'presencial', NULL, NULL,
        now() - interval '2 days', 60, 4, 'paquete', 'gcal_evt_sana_0016', NULL, NULL, NULL
    ),

    -- Sesiones de CP 6 (Per 19, Psy 7, cancelado: 1 realizada, 1 cancelada al cerrar paquete)
    (
        26, 7, NULL, 19, 19, NULL,
        (((date_trunc('week', CURRENT_DATE)::date - 31)::timestamp + TIME '10:00:00') AT TIME ZONE 'America/Bogota'),
        'realizada', 'virtual', NULL, NULL,
        now() - interval '35 days', 60, 6, 'paquete', 'gcal_evt_sana_0026', NULL, NULL, NULL
    ),
    (
        27, 7, NULL, 19, 19, NULL,
        (((date_trunc('week', CURRENT_DATE)::date - 17)::timestamp + TIME '10:00:00') AT TIME ZONE 'America/Bogota'),
        'cancelada', 'virtual', NULL, NULL,
        now() - interval '24 days', 60, 6, 'paquete', NULL, NULL, NULL, NULL
    ),

    -- Sesiones de CP 7 (Per 23, Psy 7, límite 3: 3/3 realizadas -> finalizado)
    (
        35, 7, NULL, 23, 23, NULL,
        (((date_trunc('week', CURRENT_DATE)::date - 39)::timestamp + TIME '15:00:00') AT TIME ZONE 'America/Bogota'),
        'realizada', 'presencial', NULL, NULL,
        now() - interval '43 days', 60, 7, 'paquete', 'gcal_evt_sana_0035', NULL, NULL, NULL
    ),
    (
        36, 7, NULL, 23, 23, NULL,
        (((date_trunc('week', CURRENT_DATE)::date - 32)::timestamp + TIME '15:00:00') AT TIME ZONE 'America/Bogota'),
        'realizada', 'presencial', NULL, NULL,
        now() - interval '37 days', 60, 7, 'paquete', 'gcal_evt_sana_0036', NULL, NULL, NULL
    ),
    (
        37, 7, NULL, 23, 23, NULL,
        (((date_trunc('week', CURRENT_DATE)::date - 11)::timestamp + TIME '15:00:00') AT TIME ZONE 'America/Bogota'),
        'realizada', 'presencial', NULL, NULL,
        now() - interval '20 days', 60, 7, 'paquete', 'gcal_evt_sana_0037', NULL, NULL, NULL
    );

-- =============================================================================
-- 9. HISTORIAL DE ASIGNACIÓN Y REASIGNACIÓN (appointment_assignment_history)
-- =============================================================================

INSERT INTO public.appointment_assignment_history (
    aah_id, app_id, old_psy_id, new_psy_id, sec_id, aah_changed_at, aah_reason
)
VALUES
    (1, 21, NULL, 6, 2, now() - interval '15 days', 'Asignación de franja para valoración remitida desde la Dra. Laura Hernández.'),
    (2, 22, NULL, 7, 2, now() - interval '41 days', NULL),
    (3, 24, NULL, 5, 2, now() - interval '5 days',  'Asignación inicial para evaluación infantil.'),
    (4, 24, 5,    7, 2, now() - interval '3 days',  'Reasignación solicitada para abordaje conjunto de dinámica familiar.'),
    (5, 31, NULL, 5, 2, now() - interval '7 days',  NULL),
    (6, 32, NULL, 9, 2, now() - interval '53 days', NULL),
    (7, 33, NULL, 7, 2, now() - interval '8 days',  NULL),
    (8, 39, NULL, 6, 2, now() - interval '17 days', NULL),
    (9, 40, NULL, 7, 2, now() - interval '11 days', 'Asignación provisional de remisión a Terapia Familiar.'),
    (10, 41, NULL, 6, 2, now() - interval '4 days', 'Asignación de cita personal gestionada por otra asistente administrativa.');

-- =============================================================================
-- 10. OCUPACIÓN DE AGENDA (schedule_occupancy)
-- =============================================================================
-- Regla de negocio:
--   - Se genera automáticamente un registro 'appointment' para toda cita en
--     estado 'asignada', 'confirmada' o 'realizada' con psy_id y app_date.
--   - NO existe ocupación para citas 'cancelada', 'no_asistio', 'descartada',
--     'pendiente' ni 'remitida'.
--   - Además se agregan 2 bloqueos manuales ('manual', app_id = NULL) sin cruce.

INSERT INTO public.schedule_occupancy (
    psy_id, app_id, occ_date, occ_start_time, occ_end_time, source_type, created_at
)
SELECT
    a.psy_id,
    a.app_id,
    (a.app_date AT TIME ZONE 'America/Bogota')::date,
    (a.app_date AT TIME ZONE 'America/Bogota')::time,
    ((a.app_date + (a.app_duration || ' minutes')::interval) AT TIME ZONE 'America/Bogota')::time,
    'appointment',
    a.app_created_at
FROM public.appointments a
WHERE a.app_state IN ('asignada', 'confirmada', 'realizada')
  AND a.psy_id IS NOT NULL
  AND a.app_date IS NOT NULL
  AND a.app_duration IS NOT NULL
ORDER BY a.app_id;

INSERT INTO public.schedule_occupancy (
    psy_id, app_id, occ_date, occ_start_time, occ_end_time, source_type, created_at
)
VALUES
    -- Bloqueos manuales (reunión clínica / informe institucional) en horarios libres de la próxima semana
    (5, NULL, (date_trunc('week', CURRENT_DATE)::date + 8), TIME '11:00:00', TIME '12:00:00', 'manual', now() - interval '2 days'),
    (6, NULL, (date_trunc('week', CURRENT_DATE)::date + 9), TIME '16:00:00', TIME '17:00:00', 'manual', now() - interval '2 days');

-- =============================================================================
-- 11. NOTAS CLÍNICAS Y AUDITORÍA (clinical_notes, clinical_notes_audit)
-- =============================================================================
-- Solo sobre citas en estado 'realizada' y firmadas por el psicólogo tratante.
-- Nota: App 33 (Per 22, Psy 7, ayer) se deja SIN nota clínica a propósito para
-- probar el flujo de creación en /registro-atencion/nuevo.

INSERT INTO public.clinical_notes (cn_id, app_id, psy_id, cn_observation, cn_created_at)
VALUES
    (1,  1,  6, 'Valoración inicial completada. Consultante refiere insomnio de conciliación y rumiación ansiosa. Se acuerdan objetivos terapéuticos y se sugiere paquete de intervención cognitivo-conductual.', now() - interval '41 days'),
    (2,  2,  6, 'Sesión 1 de paquete: psicoeducación sobre ciclo de la ansiedad y entrenamiento en respiración diafragmática. Buena adherencia.', now() - interval '20 days'),
    (3,  3,  6, 'Sesión 2 de paquete: registro de pensamientos automáticos e higiene del sueño. Reporta reducción leve de despertares nocturnos.', now() - interval '13 days'),
    (4,  6,  5, 'Valoración clínica infantil con participación de la madre. Se observan indicadores de ansiedad de separación y distractibilidad. Se sugiere paquete de 6 sesiones.', now() - interval '20 hours'),
    (5,  7,  6, 'Valoración inicial de estrés laboral crónico. Se identifican sobrecarga horaria y dificultad para delegar. Se propone paquete breve de 4 sesiones.', now() - interval '46 days'),
    (6,  8,  6, 'Sesión 1/4: identificación de estresores primarios y diseño de pausas activas.', now() - interval '39 days'),
    (7,  9,  6, 'Sesión 2/4: reestructuración de creencias de hiperexigencia y límites laborales.', now() - interval '32 days'),
    (8,  10, 6, 'Sesión 3/4: consolidación de estrategias de comunicación asertiva en entorno familiar.', now() - interval '18 days'),
    (9,  11, 6, 'Sesión 4/4 (cierre): cumplimiento satisfactorio de metas del paquete. Se dan recomendaciones de mantenimiento y opción de valoración de seguimiento.', now() - interval '11 days'),
    (10, 12, 5, 'Valoración infantil acompañada por abuela materna. Menor verbaliza tristeza por pérdida reciente. Se sugiere paquete de 5 sesiones con enfoque lúdico.', now() - interval '38 days'),
    (11, 13, 5, 'Sesión 1 de paquete: vínculo terapéutico establecido mediante técnicas proyectivas de dibujo y juego simbólico.', now() - interval '31 days'),
    (12, 15, 5, 'Sesión 2 de paquete (retoma tras inasistencia previa): avance en identificación y expresión verbal de emociones.', now() - interval '3 days'),
    (13, 18, 5, 'Valoración virtual completada. Por cuadro predominante de trauma en adulto se realiza remisión interna a especialista en adultos y trauma (Dr. Andrés Ramírez).', now() - interval '4 days'),
    (14, 20, 5, 'Valoración inicial presencial. Se detecta sintomatología depresiva en adulta que requiere abordaje clínico especializado; se remite a Dr. Andrés Ramírez.', now() - interval '16 days'),
    (15, 21, 6, 'Valoración por remisión completada. Se confirma episodio depresivo moderado reactivo a rehabilitación física. Lista para definición de paquete terapéutico.', now() - interval '1 day'),
    (16, 22, 7, 'Valoración inicial en pareja/familia. Se exploran detonantes de conflicto y estilos de comunicación. Se sugiere ciclo breve.', now() - interval '34 days'),
    (17, 25, 7, 'Valoración virtual completada. Ansiedad anticipatoria frente a exámenes universitarios. Se plantea acompañamiento virtual.', now() - interval '37 days'),
    (18, 26, 7, 'Sesión 1 de paquete virtual: técnicas de organización del tiempo y manejo de ansiedad ante evaluaciones.', now() - interval '30 days'),
    (19, 32, 9, 'Evaluación neuropsicológica de tamizaje por quejas de memoria asociadas a estrés. Sin signos de deterioro orgánico; se recomienda seguimiento psicoterapéutico.', now() - interval '47 days'),
    (20, 34, 7, 'Valoración inicial completada. Motivo centrado en fortalecimiento de autoestima y límites saludables. Se sugiere paquete de 3 sesiones.', now() - interval '45 days'),
    (21, 35, 7, 'Sesión 1/3: mapeo de red de apoyo y reconocimiento de fortalezas personales.', now() - interval '38 days'),
    (22, 36, 7, 'Sesión 2/3: ensayo conductual para comunicación de límites en entorno familiar.', now() - interval '31 days'),
    (23, 37, 7, 'Sesión 3/3 (cierre): objetivos cumplidos; consultante manifiesta interés en valoración de seguimiento posterior.', now() - interval '10 days'),
    (24, 39, 6, 'Valoración inicial completada. El núcleo problemático corresponde a pautas de crianza y comunicación familiar; se remite a Terapia Familiar (Dra. Mariana Trujillo).', now() - interval '12 days');

-- Auditoría de creación ('create') para cada nota + lecturas ('view') posteriores
INSERT INTO public.clinical_notes_audit (cn_id, psy_id, cna_date, cna_ip_address, cna_action)
SELECT
    cn.cn_id,
    cn.psy_id,
    cn.cn_created_at,
    '190.24.112.' || (10 + cn.psy_id)::text,
    'create'
FROM public.clinical_notes cn
ORDER BY cn.cn_id;

INSERT INTO public.clinical_notes_audit (cn_id, psy_id, cna_date, cna_ip_address, cna_action)
VALUES
    (1,  6, now() - interval '20 days', '190.24.112.16', 'view'),
    (2,  6, now() - interval '13 days', '190.24.112.16', 'view'),
    (10, 5, now() - interval '31 days', '190.24.112.15', 'view'),
    (11, 5, now() - interval '3 days',  '190.24.112.15', 'view'),
    (15, 6, now() - interval '12 hours','190.24.112.16', 'view'),
    (20, 7, now() - interval '38 days', '190.24.112.17', 'view');

-- =============================================================================
-- 12. ACEPTACIONES DE POLÍTICAS (policy_acceptance)
-- =============================================================================
-- Respeta los 3 índices únicos parciales:
--   1. (per_id, pd_id) WHERE dep_id IS NULL AND cn_id IS NULL AND app_id IS NULL
--   2. (app_id, pd_id) WHERE app_id IS NOT NULL
--   3. (cn_id,  pd_id) WHERE cn_id  IS NOT NULL

-- 12a. Términos de cuenta (account_terms, terms_of_use, privacy_policy) para
--      todos los usuarios con cuenta reclamada EXCEPTO Per 23 (para probar la
--      puerta obligatoria de aceptación de términos en el primer ingreso).
INSERT INTO public.policy_acceptance (
    per_id, dep_id, cn_id, pd_id, pa_accepted_at, pa_ip_address, app_id, pa_channel, pa_registered_by
)
SELECT
    u.use_id,
    NULL,
    NULL,
    pd.pd_id,
    COALESCE(p.per_created_at, now() - interval '10 days'),
    '181.50.14.' || (20 + u.use_id)::text,
    NULL,
    'web',
    NULL
FROM public.users u
JOIN public.person p ON p.per_id = u.use_id
JOIN LATERAL (
    SELECT DISTINCT ON (pd_type) pd_id
    FROM public.policy_documents
    WHERE pd_type IN ('account_terms', 'terms_of_use', 'privacy_policy')
    ORDER BY pd_type, pd_effective_from DESC, pd_id DESC
) pd ON true
WHERE u.use_id <> 23
ON CONFLICT (per_id, pd_id) WHERE (dep_id IS NULL AND cn_id IS NULL AND app_id IS NULL) DO NOTHING;

-- 12b. Términos de agenda (schedule_terms v2.0) para psicólogos 5, 6, 7 y 9
--      (Psy 8 se deja SIN aceptar para probar error SCHEDULE_TERMS_NOT_ACCEPTED).
INSERT INTO public.policy_acceptance (
    per_id, dep_id, cn_id, pd_id, pa_accepted_at, pa_ip_address, app_id, pa_channel, pa_registered_by
)
SELECT
    psy_id,
    NULL,
    NULL,
    (
        SELECT pd_id FROM public.policy_documents
        WHERE pd_type = 'schedule_terms'
        ORDER BY pd_effective_from DESC, pd_id DESC
        LIMIT 1
    ),
    now() - interval '115 days',
    '190.24.112.' || (10 + psy_id)::text,
    NULL,
    'web',
    NULL
FROM (VALUES (5), (6), (7), (9)) AS t(psy_id)
ON CONFLICT (per_id, pd_id) WHERE (dep_id IS NULL AND cn_id IS NULL AND app_id IS NULL) DO NOTHING;

-- 12c. Autorización de datos personales de ficha (canales asistidos por secretaría
--      y ficha de personal) -> cubre canales 'telefono', 'whatsapp' y 'presencial'.
INSERT INTO public.policy_acceptance (
    per_id, dep_id, cn_id, pd_id, pa_accepted_at, pa_ip_address, app_id, pa_channel, pa_registered_by
)
VALUES
    (
        21, NULL, NULL,
        (SELECT pd_id FROM public.policy_documents WHERE pd_type = 'data_treatment' ORDER BY pd_effective_from DESC, pd_id DESC LIMIT 1),
        now() - interval '14 days', '190.24.112.12', NULL, 'telefono', 2
    ),
    (
        24, NULL, NULL,
        (SELECT pd_id FROM public.policy_documents WHERE pd_type = 'data_treatment' ORDER BY pd_effective_from DESC, pd_id DESC LIMIT 1),
        now() - interval '19 days', '190.24.112.12', NULL, 'whatsapp', 2
    ),
    (
        22, NULL, NULL,
        (SELECT pd_id FROM public.policy_documents WHERE pd_type = 'data_treatment' ORDER BY pd_effective_from DESC, pd_id DESC LIMIT 1),
        now() - interval '56 days', '190.24.112.12', NULL, 'presencial', 2
    )
ON CONFLICT (per_id, pd_id) WHERE (dep_id IS NULL AND cn_id IS NULL AND app_id IS NULL) DO NOTHING;

-- 12d. Aceptaciones por cada solicitud de valoración (data_treatment + privacy_policy)
INSERT INTO public.policy_acceptance (
    per_id, dep_id, cn_id, pd_id, pa_accepted_at, pa_ip_address, app_id, pa_channel, pa_registered_by
)
SELECT
    a.req_id,
    NULL,
    NULL,
    pd.pd_id,
    a.app_created_at,
    '181.50.22.' || (10 + (a.app_id % 200))::text,
    a.app_id,
    CASE WHEN a.req_id = 21 THEN 'telefono' WHEN a.req_id = 24 THEN 'whatsapp' ELSE 'web' END,
    CASE WHEN a.req_id IN (21, 24) THEN 2 ELSE NULL END
FROM public.appointments a
JOIN LATERAL (
    SELECT DISTINCT ON (pd_type) pd_id
    FROM public.policy_documents
    WHERE pd_type IN ('data_treatment', 'privacy_policy')
    ORDER BY pd_type, pd_effective_from DESC, pd_id DESC
) pd ON true
WHERE a.app_kind = 'valoracion'
  AND a.app_referred_from_app_id IS NULL
ON CONFLICT (app_id, pd_id) WHERE (app_id IS NOT NULL) DO NOTHING;

-- 12e. Consentimiento de menor (dependent_consent) para valoraciones de dependientes
INSERT INTO public.policy_acceptance (
    per_id, dep_id, cn_id, pd_id, pa_accepted_at, pa_ip_address, app_id, pa_channel, pa_registered_by
)
SELECT
    a.req_id,
    a.app_patient_dependent_id,
    NULL,
    (
        SELECT pd_id FROM public.policy_documents
        WHERE pd_type = 'dependent_consent'
        ORDER BY pd_effective_from DESC, pd_id DESC
        LIMIT 1
    ),
    a.app_created_at,
    '181.50.22.' || (10 + (a.app_id % 200))::text,
    a.app_id,
    CASE WHEN a.req_id = 21 THEN 'telefono' ELSE 'web' END,
    CASE WHEN a.req_id = 21 THEN 2 ELSE NULL END
FROM public.appointments a
WHERE a.app_kind = 'valoracion'
  AND a.app_patient_dependent_id IS NOT NULL
  AND a.app_referred_from_app_id IS NULL
ON CONFLICT (app_id, pd_id) WHERE (app_id IS NOT NULL) DO NOTHING;

-- 12f. Aceptación de clinical_note_terms por cada nota clínica creada
INSERT INTO public.policy_acceptance (
    per_id, dep_id, cn_id, pd_id, pa_accepted_at, pa_ip_address, app_id, pa_channel, pa_registered_by
)
SELECT
    cn.psy_id,
    NULL,
    cn.cn_id,
    (
        SELECT pd_id FROM public.policy_documents
        WHERE pd_type = 'clinical_note_terms'
        ORDER BY pd_effective_from DESC, pd_id DESC
        LIMIT 1
    ),
    cn.cn_created_at,
    '190.24.112.' || (10 + cn.psy_id)::text,
    NULL,
    'web',
    NULL
FROM public.clinical_notes cn
ON CONFLICT (cn_id, pd_id) WHERE (cn_id IS NOT NULL) DO NOTHING;

-- =============================================================================
-- 13. DONANTES Y DONACIONES WOMPI (donors, donation)
-- =============================================================================
-- El trigger trg_donation_update_donor_total recalcula automáticamente
-- donors.dono_total_amount con la suma de donaciones APPROVED (centavos / 100).
-- Se cubren los 5 estados (APPROVED, PENDING, DECLINED, VOIDED, ERROR), los
-- 4 métodos activos (CARD, PSE, NEQUI, BANCOLOMBIA_TRANSFER), los 5 rangos de
-- monto del Reporte 5 (<20k, 20k-50k, 50k-100k, 100k-500k, >500k COP) y fechas
-- en periodo anterior (35-75 días) y periodo actual (últimos 30 y 7 días).

INSERT INTO public.donors (dono_id, dono_total_amount, dono_email, dono_last_donation_date)
VALUES
    (1, 0.00, 'donante.andrea@example.com',     CURRENT_DATE - 2),
    (2, 0.00, 'donante.empresa@example.com',    CURRENT_DATE - 5),
    (3, 0.00, 'donante.ricardo@example.com',    CURRENT_DATE - 10),
    (4, 0.00, 'donante.claudia@example.com',    CURRENT_DATE - 16),
    (5, 0.00, 'donante.mateo@example.com',      CURRENT_DATE - 4),
    (6, 0.00, 'donante.fundacion@example.com',  CURRENT_DATE - 40),
    (7, 0.00, 'donante.patricia@example.com',   CURRENT_DATE - 1),
    (8, 0.00, 'donante.javier@example.com',     CURRENT_DATE - 8);

INSERT INTO public.donation (
    don_id, don_wompi_transaction_id, don_reference, don_amount_in_cents,
    don_currency, don_status, don_payment_method_type,
    don_donor_email, don_donor_full_name, don_environment,
    don_wompi_created_at, don_created_at,
    don_terms_pd_id, don_terms_accepted_at, don_ip_address,
    don_donor_id, don_payment_method_id, don_description
)
VALUES
    -- Periodo anterior (hace 35-70 días) — permite validar comparativos en reportes
    (
        1, '120456-1730000001-00001', 'SANA-DON-PREV-0001', 3500000,
        'COP', 'APPROVED', 'CARD',
        'donante.andrea@example.com', 'Andrea Carolina Mejía Soto', 'test',
        now() - interval '62 days', now() - interval '62 days',
        (SELECT pd_id FROM public.policy_documents WHERE pd_type = 'donation_terms' ORDER BY pd_effective_from DESC, pd_id DESC LIMIT 1),
        now() - interval '62 days', '186.80.12.11',
        1, 1, 'Aporte mensual para terapia infantil.'
    ),
    (
        2, '120456-1730000002-00002', 'SANA-DON-PREV-0002', 20000000,
        'COP', 'APPROVED', 'PSE',
        'donante.empresa@example.com', 'Café Huila Sostenible S.A.S.', 'test',
        now() - interval '48 days', now() - interval '48 days',
        (SELECT pd_id FROM public.policy_documents WHERE pd_type = 'donation_terms' ORDER BY pd_effective_from DESC, pd_id DESC LIMIT 1),
        now() - interval '48 days', '186.80.12.22',
        2, 2, 'Donación corporativa de apoyo psicosocial.'
    ),
    (
        3, '120456-1730000003-00003', 'SANA-DON-PREV-0003', 8000000,
        'COP', 'APPROVED', 'NEQUI',
        'donante.fundacion@example.com', 'Aliados por la Niñez del Sur', 'test',
        now() - interval '40 days', now() - interval '40 days',
        (SELECT pd_id FROM public.policy_documents WHERE pd_type = 'donation_terms' ORDER BY pd_effective_from DESC, pd_id DESC LIMIT 1),
        now() - interval '40 days', '186.80.12.33',
        6, 3, 'Contribución jornada comunitaria Campoalegre.'
    ),
    (
        4, '120456-1730000004-00004', 'SANA-DON-PREV-0004', 5000000,
        'COP', 'DECLINED', 'CARD',
        'donante.ricardo@example.com', 'Ricardo Andrés Molina Pérez', 'test',
        now() - interval '36 days', now() - interval '36 days',
        (SELECT pd_id FROM public.policy_documents WHERE pd_type = 'donation_terms' ORDER BY pd_effective_from DESC, pd_id DESC LIMIT 1),
        now() - interval '36 days', '186.80.12.44',
        3, 1, 'Intento rechazado por entidad emisora.'
    ),

    -- Periodo actual (últimos 30 días y últimos 7 días) — cubre los 5 rangos de valor y los 5 estados
    (
        5, '120456-1730000005-00005', 'SANA-DON-CURR-0005', 1500000,   -- $15.000 (< $20.000)
        'COP', 'APPROVED', 'NEQUI',
        'donante.claudia@example.com', 'Claudia Patricia Tovar Díaz', 'test',
        now() - interval '16 days', now() - interval '16 days',
        (SELECT pd_id FROM public.policy_documents WHERE pd_type = 'donation_terms' ORDER BY pd_effective_from DESC, pd_id DESC LIMIT 1),
        now() - interval '16 days', '186.80.14.10',
        4, 3, 'Pequeño aporte con cariño para los niños.'
    ),
    (
        6, '120456-1730000006-00006', 'SANA-DON-CURR-0006', 3500000,   -- $35.000 ($20.000 a $50.000)
        'COP', 'APPROVED', 'CARD',
        'donante.ricardo@example.com', 'Ricardo Andrés Molina Pérez', 'test',
        now() - interval '10 days', now() - interval '10 days',
        (SELECT pd_id FROM public.policy_documents WHERE pd_type = 'donation_terms' ORDER BY pd_effective_from DESC, pd_id DESC LIMIT 1),
        now() - interval '10 days', '186.80.14.11',
        3, 1, 'Aporte para programas de salud mental infantil.'
    ),
    (
        7, '120456-1730000007-00007', 'SANA-DON-CURR-0007', 7500000,   -- $75.000 ($50.000 a $100.000)
        'COP', 'APPROVED', 'BANCOLOMBIA_TRANSFER',
        'donante.andrea@example.com', 'Andrea Carolina Mejía Soto', 'test',
        now() - interval '2 days', now() - interval '2 days',
        (SELECT pd_id FROM public.policy_documents WHERE pd_type = 'donation_terms' ORDER BY pd_effective_from DESC, pd_id DESC LIMIT 1),
        now() - interval '2 days', '186.80.14.12',
        1, 4, 'Donación recurrente para atención psicológica gratuita.'
    ),
    (
        8, '120456-1730000008-00008', 'SANA-DON-CURR-0008', 25000000,  -- $250.000 ($100.000 a $500.000)
        'COP', 'APPROVED', 'PSE',
        'donante.patricia@example.com', 'Patricia Elena Rojas Morales', 'test',
        now() - interval '1 day', now() - interval '1 day',
        (SELECT pd_id FROM public.policy_documents WHERE pd_type = 'donation_terms' ORDER BY pd_effective_from DESC, pd_id DESC LIMIT 1),
        now() - interval '1 day', '186.80.14.13',
        7, 2, 'Apoyo a paquetes de atención de población vulnerable.'
    ),
    (
        9, '120456-1730000009-00009', 'SANA-DON-CURR-0009', 75000000,  -- $750.000 (Más de $500.000)
        'COP', 'APPROVED', 'BANCOLOMBIA_TRANSFER',
        'donante.empresa@example.com', 'Café Huila Sostenible S.A.S.', 'test',
        now() - interval '5 days', now() - interval '5 days',
        (SELECT pd_id FROM public.policy_documents WHERE pd_type = 'donation_terms' ORDER BY pd_effective_from DESC, pd_id DESC LIMIT 1),
        now() - interval '5 days', '186.80.14.14',
        2, 4, 'Patrocinio trimestral Fundación Dejando Huellas Felices.'
    ),
    (
        10, '120456-1730000010-00010', 'SANA-DON-CURR-0010', 5000000,
        'COP', 'PENDING', 'PSE',
        'donante.mateo@example.com', 'Mateo Esteban Díaz Vargas', 'test',
        now() - interval '4 days', now() - interval '4 days',
        (SELECT pd_id FROM public.policy_documents WHERE pd_type = 'donation_terms' ORDER BY pd_effective_from DESC, pd_id DESC LIMIT 1),
        now() - interval '4 days', '186.80.14.15',
        5, 2, 'Transacción PSE pendiente de confirmación bancaria.'
    ),
    (
        11, '120456-1730000011-00011', 'SANA-DON-CURR-0011', 4000000,
        'COP', 'VOIDED', 'CARD',
        'donante.javier@example.com', 'Javier Mauricio Peña Lozano', 'test',
        now() - interval '8 days', now() - interval '8 days',
        (SELECT pd_id FROM public.policy_documents WHERE pd_type = 'donation_terms' ORDER BY pd_effective_from DESC, pd_id DESC LIMIT 1),
        now() - interval '8 days', '186.80.14.16',
        8, 1, 'Transacción anulada por el tarjetahabiente.'
    ),
    (
        12, '120456-1730000012-00012', 'SANA-DON-CURR-0012', 2000000,
        'COP', 'ERROR', 'NEQUI',
        'donante.javier@example.com', 'Javier Mauricio Peña Lozano', 'test',
        now() - interval '8 days', now() - interval '8 days',
        (SELECT pd_id FROM public.policy_documents WHERE pd_type = 'donation_terms' ORDER BY pd_effective_from DESC, pd_id DESC LIMIT 1),
        now() - interval '8 days', '186.80.14.17',
        8, 3, 'Error temporal de comunicación con pasarela.'
    );

-- =============================================================================
-- 14. CONTENIDO INSTITUCIONAL CMS
--     (content_items, content_cards, banners, news, gallery_images, content_change_log)
-- =============================================================================
-- Todas las imágenes siguen el patrón de Cloudinary validado por backend y next.config.ts.

INSERT INTO public.content_items (ci_id, ci_key, ci_type, ci_text_value, ci_image_url, ci_image_alt, mar_id, ci_updated_at)
VALUES
    (
        1, 'about.mission', 'text',
        'Acompañar el bienestar emocional y psicológico de niñas, niños, adolescentes y familias en situación de vulnerabilidad del Huila y Colombia, mediante atención profesional humana, ética y accesible.',
        NULL, NULL, 4, now() - interval '20 days'
    ),
    (
        2, 'about.vision', 'text',
        'Consolidarnos como una fundación referente en salud mental comunitaria e infancia en el sur colombiano, ampliando nuestra cobertura presencial y virtual con altos estándares clínicos y transparencia social.',
        NULL, NULL, 4, now() - interval '20 days'
    );

INSERT INTO public.content_cards (
    cc_id, cc_section, cc_title, cc_subtitle, cc_description,
    cc_image_url, cc_image_alt, cc_order, cc_is_active, cc_updated_by, cc_updated_at,
    cc_team_group, cc_facebook_url, cc_instagram_url, cc_linkedin_url,
    cc_photo_crop_x, cc_photo_crop_y, cc_photo_crop_width, cc_photo_crop_height
)
VALUES
    -- Valores (values)
    (
        1, 'values', 'Empatía y Escucha Activa', NULL,
        'Acogemos cada historia de vida sin juicios, priorizando el respeto y la calidez humana.',
        NULL, NULL, 1, true, 4, now() - interval '18 days',
        NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL
    ),
    (
        2, 'values', 'Confidencialidad y Ética', NULL,
        'Protegemos la intimidad y el secreto profesional conforme a la Ley 1090 de 2006 y Ley 1581 de 2012.',
        NULL, NULL, 2, true, 4, now() - interval '18 days',
        NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL
    ),
    (
        3, 'values', 'Interés Superior de la Niñez', NULL,
        'Todas nuestras decisiones buscan garantizar entornos seguros y protectores para niñas, niños y adolescentes.',
        NULL, NULL, 3, true, 4, now() - interval '18 days',
        NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL
    ),

    -- Equipo de trabajo (team / staff)
    (
        4, 'team', 'Rosse Mary Gómez Trujillo', 'Directora General',
        'Lidera la gestión institucional, alianzas comunitarias y proyección social de la Fundación Dejando Huellas Felices.',
        'https://res.cloudinary.com/sana-demo/image/upload/v1730000000/sana/content/team-rosse.jpg',
        'Retrato de Rosse Mary Gómez Trujillo, Directora General',
        1, true, 4, now() - interval '15 days',
        'staff',
        'https://www.facebook.com/fundacionhuellitas',
        'https://www.instagram.com/fundacionhuellitas',
        'https://www.linkedin.com/in/rosse-gomez-fdhf',
        10.00, 5.00, 80.00, 80.00
    ),
    (
        5, 'team', 'Camila Andrea Rojas Muñoz', 'Asistente Administrativa',
        'Coordina la recepción de solicitudes, agendamiento de valoraciones y seguimiento cercano a las familias.',
        'https://res.cloudinary.com/sana-demo/image/upload/v1730000000/sana/content/team-camila.jpg',
        'Retrato de Camila Andrea Rojas Muñoz, Asistente Administrativa',
        2, true, 4, now() - interval '15 days',
        'staff',
        NULL,
        'https://www.instagram.com/camila.fdhf',
        NULL,
        12.50, 10.00, 75.00, 75.00
    ),

    -- Equipo profesional (team / professional)
    (
        6, 'team', 'Dra. Laura Sofía Hernández Castro', 'Psicóloga Clínica Infantil',
        'Especialista en evaluación e intervención psicológica con niños, niñas, adolescentes y sus cuidadores.',
        'https://res.cloudinary.com/sana-demo/image/upload/v1730000000/sana/content/team-laura.jpg',
        'Retrato de la psicóloga Laura Sofía Hernández Castro',
        1, true, 4, now() - interval '15 days',
        'professional',
        NULL, NULL, 'https://www.linkedin.com/in/laura-hernandez-psicologia',
        8.00, 8.00, 84.00, 84.00
    ),
    (
        7, 'team', 'Dr. Andrés Felipe Ramírez Tovar', 'Psicólogo Clínico de Adultos',
        'Acompañamiento psicoterapéutico en ansiedad, duelo, trauma y fortalecimiento emocional.',
        'https://res.cloudinary.com/sana-demo/image/upload/v1730000000/sana/content/team-andres.jpg',
        'Retrato del psicólogo Andrés Felipe Ramírez Tovar',
        2, true, 4, now() - interval '15 days',
        'professional',
        NULL, NULL, 'https://www.linkedin.com/in/andres-ramirez-psicologia',
        NULL, NULL, NULL, NULL
    ),

    -- Servicios (services)
    (
        8, 'services', 'Valoración Psicológica Inicial', 'Presencial en Huila y Virtual',
        'Primera sesión de evaluación clínica de 60 minutos para comprender tus necesidades y definir la ruta de acompañamiento.',
        'https://res.cloudinary.com/sana-demo/image/upload/v1730000000/sana/content/service-valoracion.jpg',
        'Sesión de orientación psicológica presencial',
        1, true, 4, now() - interval '14 days',
        NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL
    ),
    (
        9, 'services', 'Paquetes de Acompañamiento Psicológico', 'Continuidad terapéutica',
        'Ciclos estructurados de 3 a 12 sesiones con el mismo profesional para consolidar avances terapéuticos sostenibles.',
        'https://res.cloudinary.com/sana-demo/image/upload/v1730000000/sana/content/service-paquetes.jpg',
        'Acompañamiento psicológico familiar',
        2, true, 4, now() - interval '14 days',
        NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL
    ),

    -- Programas (programs) — incluye 1 inactivo para probar filtrado público vs panel
    (
        10, 'programs', 'Huellas de Bienestar Infantil', 'Niños, niñas y adolescentes',
        'Atención gratuita prioritaria y talleres socioemocionales en instituciones educativas de Campoalegre y municipios vecinos.',
        'https://res.cloudinary.com/sana-demo/image/upload/v1730000000/sana/content/program-infancia.jpg',
        'Niños participando en taller lúdico de la fundación',
        1, true, 4, now() - interval '12 days',
        NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL
    ),
    (
        11, 'programs', 'Red de Cuidadores y Familias', 'Escuelas de padres',
        'Espacios de formación práctica en crianza respetuosa, comunicación afectiva y prevención de violencias.',
        NULL, NULL, 2, true, 4, now() - interval '12 days',
        NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL
    ),
    (
        12, 'programs', 'Jornada Piloto Veredal (Borrador)', 'Próximamente',
        'Programa en fase de diseño para brigadas psicológicas en veredas del norte del Huila.',
        NULL, NULL, 3, false, 4, now() - interval '5 days',
        NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL
    );

-- Banners (3 activos dentro del límite de 5, + 2 inactivos: uno con imagen y uno sin imagen)
INSERT INTO public.banners (
    ban_id, ban_title, ban_image_url, ban_image_alt,
    ban_is_active, ban_created_by, ban_updated_by, ban_updated_at
)
VALUES
    (
        1, 'Acompañamos el bienestar emocional de la niñez en el Huila',
        'https://res.cloudinary.com/sana-demo/image/upload/v1730000000/sana/banners/banner-ninez.jpg',
        'Niñas y niños sonriendo en actividad comunitaria de la fundación',
        true, 4, 4, now() - interval '15 days'
    ),
    (
        2, 'Agenda tu primera valoración psicológica en línea',
        'https://res.cloudinary.com/sana-demo/image/upload/v1730000000/sana/banners/banner-citas.jpg',
        'Profesional de psicología escuchando a una familia',
        true, 4, 4, now() - interval '10 days'
    ),
    (
        3, 'Tu donación hace posible la atención gratuita para familias vulnerables',
        'https://res.cloudinary.com/sana-demo/image/upload/v1730000000/sana/banners/banner-donaciones.jpg',
        'Manos unidas representando solidaridad comunitaria',
        true, 4, 1, now() - interval '7 days'
    ),
    (
        4, 'Campaña Día de la Salud Mental (Desactivado reutilizable)',
        'https://res.cloudinary.com/sana-demo/image/upload/v1730000000/sana/banners/banner-salud-mental.jpg',
        'Afiche informativo de la jornada de salud mental',
        false, 4, 4, now() - interval '3 days'
    ),
    (
        5, 'Borrador de campaña fin de año (Sin imagen aún)',
        NULL, NULL,
        false, 4, 4, now() - interval '1 day'
    );

-- Noticias (1 fijada publicada, 3 publicadas regulares —una sin imagen—, 1 retirada lista para eliminar o republicar)
INSERT INTO public.news (
    nw_id, nw_title, nw_body, nw_image_url, nw_image_alt,
    nw_status, nw_published_at, nw_is_pinned, nw_created_by, nw_updated_by, nw_updated_at
)
VALUES
    (
        1, 'Lanzamiento de SANA: agenda tu valoración psicológica de forma sencilla',
        'La **Fundación Dejando Huellas Felices** pone al servicio de la comunidad nuestra plataforma digital *SANA*, facilitando la solicitud de primera cita y el seguimiento de paquetes de atención en modalidad presencial y virtual.',
        'https://res.cloudinary.com/sana-demo/image/upload/v1730000000/sana/news/noticia-sana.jpg',
        'Equipo de la fundación presentando la plataforma SANA',
        'published', now() - interval '18 days', true, 4, 4, now() - interval '18 days'
    ),
    (
        2, 'Más de 120 familias beneficiadas en talleres de crianza respetuosa en Campoalegre',
        'Durante el último trimestre realizamos encuentros formativos con madres, padres y cuidadores enfocados en **comunicación afectiva** y manejo emocional en el hogar.',
        'https://res.cloudinary.com/sana-demo/image/upload/v1730000000/sana/news/noticia-talleres.jpg',
        'Familias asistentes al taller de crianza respetuosa',
        'published', now() - interval '10 days', false, 4, 4, now() - interval '10 days'
    ),
    (
        3, 'Alianza comunitaria amplía cupos de atención virtual para población migrante',
        'Gracias al apoyo de donantes y aliados sociales, ampliamos la disponibilidad de consultas virtuales para personas ubicadas fuera del departamento del Huila.',
        NULL, NULL,
        'published', now() - interval '4 days', false, 4, 1, now() - interval '4 days'
    ),
    (
        4, 'Convocatoria cerrada de voluntariado en psicología comunitaria (Retirada)',
        'Agradecemos a todos los profesionales que participaron en la convocatoria anterior. Pronto anunciaremos nuevas fechas.',
        'https://res.cloudinary.com/sana-demo/image/upload/v1730000000/sana/news/noticia-voluntariado.jpg',
        'Voluntarios en jornada comunitaria',
        'retired', now() - interval '45 days', false, 4, 4, now() - interval '12 days'
    );

-- Galería de imágenes (5 publicadas + 1 retirada)
INSERT INTO public.gallery_images (
    gi_id, gi_image_url, gi_image_alt, gi_caption,
    gi_status, gi_order, gi_created_by, gi_updated_by, gi_updated_at
)
VALUES
    (
        1, 'https://res.cloudinary.com/sana-demo/image/upload/v1730000000/sana/gallery/galeria-01.jpg',
        'Taller lúdico infantil en Campoalegre', 'Jornada de expresión emocional con niños y niñas',
        'published', 1, 4, 4, now() - interval '20 days'
    ),
    (
        2, 'https://res.cloudinary.com/sana-demo/image/upload/v1730000000/sana/gallery/galeria-02.jpg',
        'Encuentro de escuela de padres', 'Conversatorio sobre crianza positiva con cuidadores',
        'published', 2, 4, 4, now() - interval '16 days'
    ),
    (
        3, 'https://res.cloudinary.com/sana-demo/image/upload/v1730000000/sana/gallery/galeria-03.jpg',
        'Consultorio presencial de la fundación', 'Espacio cálido y seguro para atención psicológica',
        'published', 3, 4, 4, now() - interval '12 days'
    ),
    (
        4, 'https://res.cloudinary.com/sana-demo/image/upload/v1730000000/sana/gallery/galeria-04.jpg',
        'Actividad artística comunitaria', 'Mural colectivo por el bienestar emocional',
        'published', 4, 4, 4, now() - interval '7 days'
    ),
    (
        5, 'https://res.cloudinary.com/sana-demo/image/upload/v1730000000/sana/gallery/galeria-05.jpg',
        'Equipo interdisciplinario de la fundación', 'Reunión mensual de coordinación clínica y social',
        'published', 5, 4, 4, now() - interval '3 days'
    ),
    (
        6, 'https://res.cloudinary.com/sana-demo/image/upload/v1730000000/sana/gallery/galeria-06-retirada.jpg',
        'Fotografía de evento pasado archivada', 'Evento anual anterior (retirada del sitio público)',
        'retired', 6, 4, 4, now() - interval '9 days'
    );

-- Historial de cambios de contenido (content_change_log)
INSERT INTO public.content_change_log (use_id, ccl_content_type, ccl_content_id, ccl_action, ccl_changed_at)
VALUES
    (4, 'content_item',  1, 'update',     now() - interval '20 days'),
    (4, 'content_item',  2, 'update',     now() - interval '20 days'),
    (4, 'content_card',  4, 'create',     now() - interval '15 days'),
    (4, 'content_card',  6, 'create',     now() - interval '15 days'),
    (4, 'banner',        1, 'activate',   now() - interval '15 days'),
    (4, 'banner',        4, 'deactivate', now() - interval '3 days'),
    (4, 'news',          1, 'publish',    now() - interval '18 days'),
    (4, 'news',          1, 'pin',        now() - interval '18 days'),
    (4, 'news',          4, 'retire',     now() - interval '12 days'),
    (4, 'gallery_image', 1, 'publish',    now() - interval '20 days'),
    (4, 'gallery_image', 6, 'retire',     now() - interval '9 days');

-- =============================================================================
-- 15. BANDEJA DE CORREOS (email_outbox) Y REGISTROS DE SEGURIDAD (security_access_log)
-- =============================================================================
-- IMPORTANTE: Todos los correos se insertan en estado 'sent' para evitar que el
-- worker de EmailService intente enviar correos reales a direcciones ficticias
-- durante las pruebas. Se incluyen registros con contenido conservado y uno con
-- contenido depurado (NULL), ambos válidos bajo Email_Outbox_payload_ck.

INSERT INTO public.email_outbox (
    email_to, email_subject, email_text, email_html,
    email_status, email_attempts, email_next_attempt_at, email_locked_at,
    email_last_error_code, email_created_at, email_sent_at
)
VALUES
    (
        'maria.lopez@example.com',
        'Confirmación de tu cita #5 — Fundación Dejando Huellas Felices',
        'Hola María Fernanda, tu sesión de paquete ha sido confirmada con el Dr. Andrés Felipe Ramírez Tovar.',
        '<p>Hola María Fernanda, tu sesión de paquete ha sido confirmada.</p>',
        'sent', 1, now() - interval '3 days', NULL, NULL,
        now() - interval '3 days', now() - interval '3 days' + interval '15 seconds'
    ),
    (
        'psicologo.andres@fundacionhuellitas.org',
        'Nueva cita asignada #5 — Plataforma SANA',
        'Se ha confirmado una nueva cita en tu agenda con María Fernanda López Quintero.',
        '<p>Se ha confirmado una nueva cita en tu agenda.</p>',
        'sent', 1, now() - interval '3 days', NULL, NULL,
        now() - interval '3 days', now() - interval '3 days' + interval '20 seconds'
    ),
    (
        'diego.sanchez@example.com',
        'Recibimos tu solicitud de cita #23 — Fundación Dejando Huellas Felices',
        'Hola Diego Mauricio, recibimos tu solicitud de cita virtual. Nuestro equipo administrativo se pondrá en contacto contigo.',
        '<p>Recibimos tu solicitud de cita virtual #23.</p>',
        'sent', 1, now() - interval '2 days', NULL, NULL,
        now() - interval '2 days', now() - interval '2 days' + interval '12 seconds'
    ),
    (
        'marketing.pendiente@fundacionhuellitas.org',
        'Bienvenido/a a SANA — Tu cuenta ha sido habilitada',
        'Hola Valentina, tu cuenta con rol Marketing fue creada. Inicia sesión con Google para activarla.',
        '<p>Hola Valentina, tu cuenta en SANA ha sido habilitada.</p>',
        'sent', 1, now() - interval '5 days', NULL, NULL,
        now() - interval '5 days', now() - interval '5 days' + interval '18 seconds'
    ),
    (
        -- Registro enviado con contenido purgado (minimización de datos)
        NULL, NULL, NULL, NULL,
        'sent', 1, now() - interval '40 days', NULL, NULL,
        now() - interval '40 days', now() - interval '40 days' + interval '10 seconds'
    );

INSERT INTO public.security_access_log (
    use_id, security_access_log_section, security_access_log_message, security_access_log_created_at
)
VALUES
    (
        1, 'User Management',
        'Admin changed person 9 status to ''inactive'': Licencia temporal aprobada por dirección',
        now() - interval '30 days'
    ),
    (
        1, 'User Management',
        'Admin changed person 10 status to ''blocked'': Baja lógica desde gestión de usuarios',
        now() - interval '25 days'
    ),
    (
        9, 'Auth0 Sign-In',
        'Auth0 user psicologa.inactiva@fundacionhuellitas.org denied: account state ''inactivo''.',
        now() - interval '20 days'
    ),
    (
        4, '/reportes',
        'User m***a@fundacionhuellitas.org [Roles: marketing] denied access to section requiring [administrador].',
        now() - interval '6 days'
    ),
    (
        13, '/usuarios',
        'User m***z@example.com [Roles: consultante] denied access to section requiring [administrador].',
        now() - interval '2 days'
    );

-- =============================================================================
-- 16. SINCRONIZACIÓN DE SECUENCIAS (evita colisiones en nuevos INSERTs)
-- =============================================================================

SELECT setval(pg_get_serial_sequence('public.policy_documents', 'pd_id'),
              COALESCE((SELECT MAX(pd_id) FROM public.policy_documents), 1), true);
SELECT setval(pg_get_serial_sequence('public.person', 'per_id'),
              COALESCE((SELECT MAX(per_id) FROM public.person), 1), true);
SELECT setval(pg_get_serial_sequence('public.dependents', 'dep_id'),
              COALESCE((SELECT MAX(dep_id) FROM public.dependents), 1), true);
SELECT setval(pg_get_serial_sequence('public.schedule_recurring_blocks', 'srb_id'),
              COALESCE((SELECT MAX(srb_id) FROM public.schedule_recurring_blocks), 1), true);
SELECT setval(pg_get_serial_sequence('public.schedule', 'sch_id'),
              COALESCE((SELECT MAX(sch_id) FROM public.schedule), 1), true);
SELECT setval(pg_get_serial_sequence('public.appointments', 'app_id'),
              COALESCE((SELECT MAX(app_id) FROM public.appointments), 1), true);
SELECT setval(pg_get_serial_sequence('public.care_packages', 'cp_id'),
              COALESCE((SELECT MAX(cp_id) FROM public.care_packages), 1), true);
SELECT setval(pg_get_serial_sequence('public.appointment_assignment_history', 'aah_id'),
              COALESCE((SELECT MAX(aah_id) FROM public.appointment_assignment_history), 1), true);
SELECT setval(pg_get_serial_sequence('public.schedule_occupancy', 'occ_id'),
              COALESCE((SELECT MAX(occ_id) FROM public.schedule_occupancy), 1), true);
SELECT setval(pg_get_serial_sequence('public.clinical_notes', 'cn_id'),
              COALESCE((SELECT MAX(cn_id) FROM public.clinical_notes), 1), true);
SELECT setval(pg_get_serial_sequence('public.clinical_notes_audit', 'cna_id'),
              COALESCE((SELECT MAX(cna_id) FROM public.clinical_notes_audit), 1), true);
SELECT setval(pg_get_serial_sequence('public.policy_acceptance', 'pa_id'),
              COALESCE((SELECT MAX(pa_id) FROM public.policy_acceptance), 1), true);
SELECT setval(pg_get_serial_sequence('public.donors', 'dono_id'),
              COALESCE((SELECT MAX(dono_id) FROM public.donors), 1), true);
SELECT setval(pg_get_serial_sequence('public.donation', 'don_id'),
              COALESCE((SELECT MAX(don_id) FROM public.donation), 1), true);
SELECT setval(pg_get_serial_sequence('public.content_items', 'ci_id'),
              COALESCE((SELECT MAX(ci_id) FROM public.content_items), 1), true);
SELECT setval(pg_get_serial_sequence('public.content_cards', 'cc_id'),
              COALESCE((SELECT MAX(cc_id) FROM public.content_cards), 1), true);
SELECT setval(pg_get_serial_sequence('public.banners', 'ban_id'),
              COALESCE((SELECT MAX(ban_id) FROM public.banners), 1), true);
SELECT setval(pg_get_serial_sequence('public.news', 'nw_id'),
              COALESCE((SELECT MAX(nw_id) FROM public.news), 1), true);
SELECT setval(pg_get_serial_sequence('public.gallery_images', 'gi_id'),
              COALESCE((SELECT MAX(gi_id) FROM public.gallery_images), 1), true);
SELECT setval(pg_get_serial_sequence('public.content_change_log', 'ccl_id'),
              COALESCE((SELECT MAX(ccl_id) FROM public.content_change_log), 1), true);
SELECT setval(pg_get_serial_sequence('public.email_outbox', 'email_id'),
              COALESCE((SELECT MAX(email_id) FROM public.email_outbox), 1), true);
SELECT setval(pg_get_serial_sequence('public.security_access_log', 'security_access_log_id'),
              COALESCE((SELECT MAX(security_access_log_id) FROM public.security_access_log), 1), true);

COMMIT;
