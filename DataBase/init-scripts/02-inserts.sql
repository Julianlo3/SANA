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