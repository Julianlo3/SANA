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

INSERT INTO public.policy_documents (pd_type, pd_version, pd_content)
VALUES
    (
        'data_treatment',
        '1.0',
        'BORRADOR GENERICO. La Fundacion tratara los datos personales de la persona titular para gestionar solicitudes, prestar y coordinar servicios de orientacion psicologica, realizar comunicaciones relacionadas con la atencion y cumplir obligaciones legales. El acceso se limitara al personal autorizado y los datos se conservaran durante el tiempo necesario para estas finalidades. La persona titular podra ejercer los derechos que le reconoce la legislacion aplicable mediante los canales oficiales de la Fundacion.'
    ),
    (
        'dependent_consent',
        '1.0',
        'BORRADOR GENERICO. Como padre, madre o representante legal, autorizo el tratamiento de los datos personales del menor a mi cargo para gestionar la solicitud y coordinar la atencion psicologica. Declaro que estoy facultado para otorgar esta autorizacion y entiendo que los datos seran tratados de forma confidencial, con acceso limitado al personal autorizado y conforme a la legislacion aplicable.'
    ),
    (
        'schedule_terms',
        '1.0',
        'BORRADOR GENERICO. Al aceptar, autorizo el tratamiento de mis datos profesionales y de disponibilidad para administrar la agenda, asignar y coordinar citas, y registrar los cambios necesarios para la operacion del servicio. Me comprometo a mantener actualizada mi disponibilidad y a proteger la confidencialidad de la informacion de las personas atendidas.'
    ),
    (
        'clinical_note_terms',
        '1.0',
        'BORRADOR GENERICO. Al registrar una nota clinica, confirmo que la informacion corresponde a la atencion realizada, que incluire solo datos pertinentes para su continuidad y que mantendre su confidencialidad. Entiendo que el acceso y la consulta de la nota pueden quedar registrados para fines de seguridad, auditoria y cumplimiento de las obligaciones aplicables.'
    )
ON CONFLICT (pd_type, pd_version) DO NOTHING;