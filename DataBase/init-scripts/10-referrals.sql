-- Migración para remisión de valoraciones entre psicólogos (HU Remisión de Valoración)

-- 1. Actualizar restricción de estados de appointments para incluir 'remitida'
ALTER TABLE public.appointments
  DROP CONSTRAINT IF EXISTS "Appointment_state_ck";

ALTER TABLE public.appointments
  ADD CONSTRAINT "Appointment_state_ck"
  CHECK (app_state IN (
    'pendiente',
    'remitida',
    'asignada',
    'confirmada',
    'descartada',
    'cancelada',
    'realizada',
    'no_asistio'
  ));

-- 2. Agregar columnas de trazabilidad de remisión en appointments
--    - app_referred_from_app_id: en la nueva valoración remitida, apunta a la valoración previa que originó la remisión.
--    - app_referred_to_psy_id: en la valoración previa (que queda 'realizada'), registra a qué psicólogo fue remitido el paciente.
--    - app_referral_reason: motivo/observación clínica-administrativa de la remisión.
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS app_referred_from_app_id integer NULL REFERENCES public.appointments(app_id),
  ADD COLUMN IF NOT EXISTS app_referred_to_psy_id integer NULL REFERENCES public.psychologist(psy_id),
  ADD COLUMN IF NOT EXISTS app_referral_reason text NULL;

-- Garantiza que una valoración solo pueda generar a lo sumo una remisión
CREATE UNIQUE INDEX IF NOT EXISTS appointment_referred_from_app_uq
  ON public.appointments(app_referred_from_app_id)
  WHERE app_referred_from_app_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS appointment_referred_to_psy_idx
  ON public.appointments(app_referred_to_psy_id)
  WHERE app_referred_to_psy_id IS NOT NULL;
