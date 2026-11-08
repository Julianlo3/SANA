-------------------------------------------------------------------
-- MIGRACIÓN: Documentos legales v1 (canal de aceptacion y aceptacion
-- de condiciones en donaciones)
-- Solo agrega columnas y restricciones; puede ejecutarse varias veces.
-------------------------------------------------------------------

-- ========================= 1. POLICY ACCEPTANCE =========================

ALTER TABLE public.policy_acceptance
    ADD COLUMN IF NOT EXISTS pa_channel varchar(15) NOT NULL DEFAULT 'web';

ALTER TABLE public.policy_acceptance
    ADD COLUMN IF NOT EXISTS pa_registered_by integer;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'Policy_Acceptance_channel_ck'
          AND conrelid = 'public.policy_acceptance'::regclass
    ) THEN
        ALTER TABLE public.policy_acceptance
            ADD CONSTRAINT "Policy_Acceptance_channel_ck"
            CHECK (pa_channel IN ('web', 'telefono', 'whatsapp', 'presencial'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'Policy_Acceptance_Registered_By_fk'
          AND conrelid = 'public.policy_acceptance'::regclass
    ) THEN
        ALTER TABLE public.policy_acceptance
            ADD CONSTRAINT "Policy_Acceptance_Registered_By_fk" FOREIGN KEY (pa_registered_by)
            REFERENCES public.users (use_id)
            ON DELETE NO ACTION ON UPDATE NO ACTION;
    END IF;
END
$$;

COMMENT ON COLUMN public.policy_acceptance.pa_channel
    IS E'Canal por el cual se obtuvo la aceptacion: web (la persona acepto en la plataforma), telefono, whatsapp o presencial (registrada por el personal)';
COMMENT ON COLUMN public.policy_acceptance.pa_registered_by
    IS E'Identificador del usuario del personal que registro la aceptacion obtenida por telefono, whatsapp o en persona; null cuando la persona acepto directamente en la web';
COMMENT ON CONSTRAINT "Policy_Acceptance_channel_ck" ON public.policy_acceptance
    IS E'Restringe pa_channel a los valores conocidos: web, telefono, whatsapp o presencial';
COMMENT ON CONSTRAINT "Policy_Acceptance_Registered_By_fk" ON public.policy_acceptance
    IS E'Identificador proveniente del usuario del personal que registro la aceptacion';


-- ========================= 2. DONATION =========================

ALTER TABLE public.donation
    ADD COLUMN IF NOT EXISTS don_terms_pd_id integer;

ALTER TABLE public.donation
    ADD COLUMN IF NOT EXISTS don_terms_accepted_at timestamptz;

ALTER TABLE public.donation
    ADD COLUMN IF NOT EXISTS don_ip_address varchar(50);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'Donation_Terms_Document_fk'
          AND conrelid = 'public.donation'::regclass
    ) THEN
        ALTER TABLE public.donation
            ADD CONSTRAINT "Donation_Terms_Document_fk" FOREIGN KEY (don_terms_pd_id)
            REFERENCES public.policy_documents (pd_id)
            ON DELETE NO ACTION ON UPDATE NO ACTION;
    END IF;
END
$$;

COMMENT ON COLUMN public.donation.don_terms_pd_id
    IS E'Identificador del documento de condiciones de donacion (donation_terms) que acepto el donante';
COMMENT ON COLUMN public.donation.don_terms_accepted_at
    IS E'Fecha y hora en la que el donante acepto las condiciones de donacion';
COMMENT ON COLUMN public.donation.don_ip_address
    IS E'Direccion IP desde la cual el donante acepto las condiciones de donacion';
COMMENT ON CONSTRAINT "Donation_Terms_Document_fk" ON public.donation
    IS E'Identificador proveniente del documento de politica aceptado en la donacion';
