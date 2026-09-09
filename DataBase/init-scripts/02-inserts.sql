-- Aqui iran todos los inserts iniciales y de prueba

-- ---------------------------------------------------------
-- Catalogo: rol
-- ---------------------------------------------------------
INSERT INTO public.rol (rol_id, rol_description) VALUES
    (1, 'secretario'),
    (2, 'marketing'),
    (3, 'consultante'),
    (4, 'administrador'),
    (5, 'psicologo');

-- ---------------------------------------------------------
-- Catalogo: relationship (parentesco)
-- ---------------------------------------------------------
INSERT INTO public.relationship (rel_id, rel_description) VALUES
    (1, 'madre'),
    (2, 'padre'),
    (3, 'tio/a'),
    (4, 'abuelo/a');