-------------------------------------------------------------------
-- MIGRACIÓN: Perfil del equipo en content_cards (grupo, redes
-- sociales y recorte de la foto circular)
-- Solo agrega columnas y restricciones; puede ejecutarse varias veces.
-------------------------------------------------------------------

-- ========================= 1. COLUMNAS =========================

ALTER TABLE public.content_cards
    ADD COLUMN IF NOT EXISTS cc_team_group varchar(15);

ALTER TABLE public.content_cards
    ADD COLUMN IF NOT EXISTS cc_facebook_url varchar(300);

ALTER TABLE public.content_cards
    ADD COLUMN IF NOT EXISTS cc_instagram_url varchar(300);

ALTER TABLE public.content_cards
    ADD COLUMN IF NOT EXISTS cc_linkedin_url varchar(300);

ALTER TABLE public.content_cards
    ADD COLUMN IF NOT EXISTS cc_photo_crop_x numeric(5,2);

ALTER TABLE public.content_cards
    ADD COLUMN IF NOT EXISTS cc_photo_crop_y numeric(5,2);

ALTER TABLE public.content_cards
    ADD COLUMN IF NOT EXISTS cc_photo_crop_width numeric(5,2);

ALTER TABLE public.content_cards
    ADD COLUMN IF NOT EXISTS cc_photo_crop_height numeric(5,2);

-- ========================= 2. DATOS EXISTENTES =========================

UPDATE public.content_cards
SET cc_team_group = 'staff'
WHERE cc_section = 'team' AND cc_team_group IS NULL;

-- ========================= 3. RESTRICCIONES =========================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'Content_Cards_team_group_ck'
          AND conrelid = 'public.content_cards'::regclass
    ) THEN
        ALTER TABLE public.content_cards
            ADD CONSTRAINT "Content_Cards_team_group_ck"
            CHECK (cc_team_group IN ('staff', 'professional'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'Content_Cards_team_group_section_ck'
          AND conrelid = 'public.content_cards'::regclass
    ) THEN
        ALTER TABLE public.content_cards
            ADD CONSTRAINT "Content_Cards_team_group_section_ck"
            CHECK ((cc_section = 'team') = (cc_team_group IS NOT NULL));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'Content_Cards_social_section_ck'
          AND conrelid = 'public.content_cards'::regclass
    ) THEN
        ALTER TABLE public.content_cards
            ADD CONSTRAINT "Content_Cards_social_section_ck"
            CHECK (
                cc_section = 'team'
                OR (cc_facebook_url IS NULL AND cc_instagram_url IS NULL AND cc_linkedin_url IS NULL)
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'Content_Cards_facebook_url_ck'
          AND conrelid = 'public.content_cards'::regclass
    ) THEN
        ALTER TABLE public.content_cards
            ADD CONSTRAINT "Content_Cards_facebook_url_ck"
            CHECK (cc_facebook_url ~* '^https://([a-z0-9-]+\.)*facebook\.com/\S+$');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'Content_Cards_instagram_url_ck'
          AND conrelid = 'public.content_cards'::regclass
    ) THEN
        ALTER TABLE public.content_cards
            ADD CONSTRAINT "Content_Cards_instagram_url_ck"
            CHECK (cc_instagram_url ~* '^https://([a-z0-9-]+\.)*instagram\.com/\S+$');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'Content_Cards_linkedin_url_ck'
          AND conrelid = 'public.content_cards'::regclass
    ) THEN
        ALTER TABLE public.content_cards
            ADD CONSTRAINT "Content_Cards_linkedin_url_ck"
            CHECK (cc_linkedin_url ~* '^https://([a-z0-9-]+\.)*linkedin\.com/\S+$');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'Content_Cards_photo_crop_ck'
          AND conrelid = 'public.content_cards'::regclass
    ) THEN
        ALTER TABLE public.content_cards
            ADD CONSTRAINT "Content_Cards_photo_crop_ck"
            CHECK (
                (cc_photo_crop_x IS NULL AND cc_photo_crop_y IS NULL
                    AND cc_photo_crop_width IS NULL AND cc_photo_crop_height IS NULL)
                OR (
                    cc_section = 'team'
                    AND cc_image_url IS NOT NULL
                    AND cc_photo_crop_x IS NOT NULL AND cc_photo_crop_y IS NOT NULL
                    AND cc_photo_crop_width IS NOT NULL AND cc_photo_crop_height IS NOT NULL
                    AND cc_photo_crop_x >= 0 AND cc_photo_crop_y >= 0
                    AND cc_photo_crop_width > 0 AND cc_photo_crop_height > 0
                    AND cc_photo_crop_x + cc_photo_crop_width <= 100
                    AND cc_photo_crop_y + cc_photo_crop_height <= 100
                )
            );
    END IF;
END
$$;

-- ========================= 4. COMENTARIOS =========================

COMMENT ON COLUMN public.content_cards.cc_description
    IS E'Texto descriptivo; en team incluye el perfil profesional y la descripcion de la persona';
COMMENT ON COLUMN public.content_cards.cc_team_group
    IS E'Bloque del equipo al que pertenece la persona: staff (equipo de trabajo) o professional (equipo profesional). Obligatorio en team y null en las demas secciones';
COMMENT ON COLUMN public.content_cards.cc_facebook_url
    IS E'URL opcional del perfil de Facebook de la persona; solo en team. Vacio no se muestra';
COMMENT ON COLUMN public.content_cards.cc_instagram_url
    IS E'URL opcional del perfil de Instagram de la persona; solo en team. Vacio no se muestra';
COMMENT ON COLUMN public.content_cards.cc_linkedin_url
    IS E'URL opcional del perfil de LinkedIn de la persona; solo en team. Vacio no se muestra';
COMMENT ON COLUMN public.content_cards.cc_photo_crop_x
    IS E'Inicio horizontal del recorte de la foto circular, en porcentaje del ancho de la imagen original';
COMMENT ON COLUMN public.content_cards.cc_photo_crop_y
    IS E'Inicio vertical del recorte de la foto circular, en porcentaje del alto de la imagen original';
COMMENT ON COLUMN public.content_cards.cc_photo_crop_width
    IS E'Ancho del recorte de la foto circular, en porcentaje del ancho de la imagen original';
COMMENT ON COLUMN public.content_cards.cc_photo_crop_height
    IS E'Alto del recorte de la foto circular, en porcentaje del alto de la imagen original';
COMMENT ON CONSTRAINT "Content_Cards_team_group_ck" ON public.content_cards
    IS E'Restringe cc_team_group a los valores conocidos: staff o professional';
COMMENT ON CONSTRAINT "Content_Cards_team_group_section_ck" ON public.content_cards
    IS E'El grupo es obligatorio en team y debe ser null en las demas secciones';
COMMENT ON CONSTRAINT "Content_Cards_social_section_ck" ON public.content_cards
    IS E'Las redes sociales solo se registran en la seccion team';
COMMENT ON CONSTRAINT "Content_Cards_facebook_url_ck" ON public.content_cards
    IS E'La URL de Facebook debe ser https y pertenecer al dominio facebook.com';
COMMENT ON CONSTRAINT "Content_Cards_instagram_url_ck" ON public.content_cards
    IS E'La URL de Instagram debe ser https y pertenecer al dominio instagram.com';
COMMENT ON CONSTRAINT "Content_Cards_linkedin_url_ck" ON public.content_cards
    IS E'La URL de LinkedIn debe ser https y pertenecer al dominio linkedin.com';
COMMENT ON CONSTRAINT "Content_Cards_photo_crop_ck" ON public.content_cards
    IS E'El recorte va completo o vacio, solo en team con imagen, y debe quedar dentro de la imagen original';
