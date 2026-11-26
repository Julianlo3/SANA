SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';

--
-- Name: fn_cleanup_old_security_logs(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_cleanup_old_security_logs(p_retention_days integer DEFAULT 180) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_deleted_count integer;
BEGIN
    DELETE FROM public.security_access_log
     WHERE security_access_log_created_at < now() - (p_retention_days || ' days')::interval;

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RETURN v_deleted_count;
END;
$$;

--
-- Name: FUNCTION fn_cleanup_old_security_logs(p_retention_days integer); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.fn_cleanup_old_security_logs(p_retention_days integer) IS 'Purga registros de auditoria de seguridad que superan el periodo de retencion en dias (por defecto 180 dias) para cumplir con minimizacion de datos';

--
--
-- Name: fn_update_donor_total_amount(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_update_donor_total_amount() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_dono_id integer;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_dono_id := OLD.don_donor_id;
    ELSE
        v_dono_id := NEW.don_donor_id;
    END IF;

    UPDATE public.donors
       SET dono_total_amount = (
                SELECT COALESCE(SUM(don_amount_in_cents), 0) / 100.0
                  FROM public.donation
                 WHERE don_donor_id = v_dono_id
                   AND don_status = 'APPROVED'
           )
     WHERE dono_id = v_dono_id;

    IF TG_OP = 'UPDATE' AND OLD.don_donor_id IS DISTINCT FROM NEW.don_donor_id THEN
        UPDATE public.donors
           SET dono_total_amount = (
                    SELECT COALESCE(SUM(don_amount_in_cents), 0) / 100.0
                      FROM public.donation
                     WHERE don_donor_id = OLD.don_donor_id
                       AND don_status = 'APPROVED'
               )
         WHERE dono_id = OLD.don_donor_id;
    END IF;

    RETURN NULL;
END;
$$;

--
-- Name: FUNCTION fn_update_donor_total_amount(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.fn_update_donor_total_amount() IS 'Recalcula donors.dono_total_amount como la suma de las donaciones aprobadas de public.donation, convirtiendo los centavos a unidades monetarias.';

SET default_table_access_method = heap;

--
-- Name: appointment_assignment_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.appointment_assignment_history (
    aah_id integer NOT NULL,
    app_id integer NOT NULL,
    old_psy_id integer,
    new_psy_id integer NOT NULL,
    sec_id integer NOT NULL,
    aah_changed_at timestamp with time zone DEFAULT now() NOT NULL,
    aah_reason character varying(255)
);

--
-- Name: TABLE appointment_assignment_history; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.appointment_assignment_history IS 'Historial de cambios de asignación de psicólogos a citas para seguimiento y auditoría';

--
-- Name: COLUMN appointment_assignment_history.aah_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.appointment_assignment_history.aah_id IS 'Identificador del registro de historial';

--
-- Name: COLUMN appointment_assignment_history.app_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.appointment_assignment_history.app_id IS 'Identificador de la cita';

--
-- Name: COLUMN appointment_assignment_history.old_psy_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.appointment_assignment_history.old_psy_id IS 'Identificador del psicólogo anterior (null si es primera asignación)';

--
-- Name: COLUMN appointment_assignment_history.new_psy_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.appointment_assignment_history.new_psy_id IS 'Identificador del nuevo psicólogo asignado';

--
-- Name: COLUMN appointment_assignment_history.sec_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.appointment_assignment_history.sec_id IS 'Identificador del secretario que realizó el cambio';

--
-- Name: COLUMN appointment_assignment_history.aah_changed_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.appointment_assignment_history.aah_changed_at IS 'Fecha y hora del cambio de asignación';

--
-- Name: COLUMN appointment_assignment_history.aah_reason; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.appointment_assignment_history.aah_reason IS 'Motivo del cambio de asignación (opcional)';

--
-- Name: appointment_assignment_history_aah_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.appointment_assignment_history ALTER COLUMN aah_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.appointment_assignment_history_aah_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

--
-- Name: appointments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.appointments (
    app_id integer NOT NULL,
    psy_id integer,
    sec_id integer,
    req_id integer NOT NULL,
    app_patient_person_id integer,
    app_patient_dependent_id integer,
    app_date timestamp with time zone,
    app_state character varying(15) NOT NULL,
    app_type character varying(15) NOT NULL,
    app_reason text,
    app_discard_reason text,
    app_created_at timestamp with time zone DEFAULT now() NOT NULL,
    app_duration integer,
    cp_id integer,
    app_kind character varying(12) DEFAULT 'valoracion'::character varying NOT NULL,
    app_calendar_event_id character varying(255),
    CONSTRAINT "Appointment_pacient_ck" CHECK (((app_patient_person_id IS NOT NULL) OR (app_patient_dependent_id IS NOT NULL))),
    CONSTRAINT "Appointment_state_ck" CHECK (((app_state)::text = ANY ((ARRAY['pendiente'::character varying, 'asignada'::character varying, 'confirmada'::character varying, 'descartada'::character varying, 'cancelada'::character varying, 'realizada'::character varying, 'no_asistio'::character varying])::text[]))),
    CONSTRAINT "Appointment_type_ck" CHECK (((app_type)::text = ANY (ARRAY[('presencial'::character varying)::text, ('virtual'::character varying)::text]))),
    CONSTRAINT appointment_kind_ck CHECK (((app_kind)::text = ANY ((ARRAY['valoracion'::character varying, 'paquete'::character varying])::text[])))
);

--
-- Name: TABLE appointments; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.appointments IS 'Representa la planeacion para el planteamiento de la cita psicologica';

--
-- Name: COLUMN appointments.app_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.appointments.app_id IS 'Index, identificador de la cita (este valor puede asignarse, pero en caso contrario incrementa automaticamente)';

--
-- Name: COLUMN appointments.psy_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.appointments.psy_id IS 'Identificador del psicologo';

--
-- Name: COLUMN appointments.sec_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.appointments.sec_id IS 'Identificador del secretario';

--
-- Name: COLUMN appointments.req_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.appointments.req_id IS 'Identificador del consultante';

--
-- Name: COLUMN appointments.app_patient_person_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.appointments.app_patient_person_id IS 'Identificador del paciente si este es para el propio consultante';

--
-- Name: COLUMN appointments.app_patient_dependent_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.appointments.app_patient_dependent_id IS 'Identificador del paciente si este es para un dependiente (menor de edad) registrado por el consultante';

--
-- Name: COLUMN appointments.app_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.appointments.app_date IS 'Fecha de cuando inicia la cita';

--
-- Name: COLUMN appointments.app_state; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.appointments.app_state IS 'Estado actual de la cita';

--
-- Name: COLUMN appointments.app_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.appointments.app_type IS 'Tipo de la cita';

--
-- Name: COLUMN appointments.app_reason; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.appointments.app_reason IS 'Motivo de consulta: texto proporcionado por el paciente al solicitar la cita';

--
-- Name: COLUMN appointments.app_discard_reason; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.appointments.app_discard_reason IS 'Motivo interno indicado por la asistente al descartar una solicitud';

--
-- Name: COLUMN appointments.app_created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.appointments.app_created_at IS 'Fecha y hora en que el consultante registró la solicitud de cita';

--
-- Name: COLUMN appointments.app_duration; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.appointments.app_duration IS 'Duracion de la cita en minutos';

--
-- Name: CONSTRAINT "Appointment_pacient_ck" ON appointments; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT "Appointment_pacient_ck" ON public.appointments IS 'Restriccion que obliga que exista un paciente, sea el consultante o el dependiente';

--
-- Name: CONSTRAINT "Appointment_type_ck" ON appointments; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT "Appointment_type_ck" ON public.appointments IS 'Modalidad de la cita: presencial o virtual';

--
-- Name: appointments_app_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.appointments ALTER COLUMN app_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.appointments_app_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

--
-- Name: banners; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.banners (
    ban_id integer NOT NULL,
    ban_title character varying(120) NOT NULL,
    ban_image_url character varying(500),
    ban_image_alt character varying(150),
    ban_is_active boolean DEFAULT false NOT NULL,
    ban_created_by integer NOT NULL,
    ban_updated_by integer NOT NULL,
    ban_updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "Banners_active_requires_ck" CHECK (((NOT ban_is_active) OR (ban_image_url IS NOT NULL))),
    CONSTRAINT "Banners_image_alt_ck" CHECK (((ban_image_url IS NULL) OR (ban_image_alt IS NOT NULL)))
);

--
-- Name: TABLE banners; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.banners IS 'Banners de la pagina de inicio; los activos rotan en la primera pantalla';

--
-- Name: COLUMN banners.ban_is_active; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.banners.ban_is_active IS 'Activado por el usuario. Requiere imagen';

--
-- Name: banners_ban_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.banners ALTER COLUMN ban_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.banners_ban_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

--
-- Name: care_packages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.care_packages (
    cp_id integer NOT NULL,
    cp_patient_person_id integer,
    cp_patient_dependent_id integer,
    cp_assessment_app_id integer NOT NULL,
    psy_id integer NOT NULL,
    sec_id integer,
    cp_session_limit integer NOT NULL,
    cp_priority character varying(10) NOT NULL,
    cp_state character varying(12) DEFAULT 'sugerido'::character varying NOT NULL,
    cp_created_at timestamp with time zone DEFAULT now() NOT NULL,
    cp_closed_at timestamp with time zone,
    cp_closed_by integer,
    cp_close_reason text,
    cp_reviewed_at timestamp with time zone,
    cp_suggestion_comment text,
    cp_rejection_reason text,
    cp_suggested_session_limit integer,
    cp_suggested_priority character varying(10),
    CONSTRAINT care_package_patient_ck CHECK ((((cp_patient_person_id IS NOT NULL) AND (cp_patient_dependent_id IS NULL)) OR ((cp_patient_person_id IS NULL) AND (cp_patient_dependent_id IS NOT NULL)))),
    CONSTRAINT care_packages_cp_priority_check CHECK (((cp_priority)::text = ANY ((ARRAY['alta'::character varying, 'media'::character varying, 'baja'::character varying])::text[]))),
    CONSTRAINT care_packages_cp_session_limit_check CHECK ((cp_session_limit > 0)),
    CONSTRAINT care_packages_cp_state_check CHECK (((cp_state)::text = ANY ((ARRAY['sugerido'::character varying, 'activo'::character varying, 'rechazado'::character varying, 'finalizado'::character varying, 'cancelado'::character varying])::text[])))
);

--
-- Name: care_packages_cp_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.care_packages ALTER COLUMN cp_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.care_packages_cp_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

--
-- Name: clinical_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clinical_notes (
    cn_id integer NOT NULL,
    app_id integer NOT NULL,
    psy_id integer NOT NULL,
    cn_observation text NOT NULL,
    cn_created_at timestamp with time zone DEFAULT now() NOT NULL
);

--
-- Name: TABLE clinical_notes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.clinical_notes IS 'Notas/observaciones clinicas que un psicologo registra sobre una cita puntual. El paciente (consultante o dependiente) se obtiene de la cita referenciada, no se duplica aqui';

--
-- Name: COLUMN clinical_notes.cn_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.clinical_notes.cn_id IS 'Index, identificador de la nota clinica (incrementa automaticamente)';

--
-- Name: COLUMN clinical_notes.app_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.clinical_notes.app_id IS 'Identificador de la cita a la que corresponde la nota; de ahi se deriva el paciente (person o dependent) y el consultante';

--
-- Name: COLUMN clinical_notes.psy_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.clinical_notes.psy_id IS 'Identificador del psicologo autor de la nota (puede diferir del psy_id de la cita, ej. interconsulta o supervision)';

--
-- Name: COLUMN clinical_notes.cn_observation; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.clinical_notes.cn_observation IS 'Texto libre de la observacion clinica; tipo text, sin limite practico de longitud';

--
-- Name: COLUMN clinical_notes.cn_created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.clinical_notes.cn_created_at IS 'Fecha y hora en la que se registro la nota';

--
-- Name: clinical_notes_audit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clinical_notes_audit (
    cna_id integer NOT NULL,
    cn_id integer NOT NULL,
    psy_id integer NOT NULL,
    cna_date timestamp with time zone DEFAULT now() NOT NULL,
    cna_ip_address character varying(50) NOT NULL,
    cna_action character varying(10) DEFAULT 'view'::character varying NOT NULL,
    CONSTRAINT "Clinical_Notes_Audit_action_ck" CHECK (((cna_action)::text = ANY (ARRAY[('create'::character varying)::text, ('view'::character varying)::text])))
);

--
-- Name: TABLE clinical_notes_audit; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.clinical_notes_audit IS 'Tabla auditoria nota clinica del psicologo';

--
-- Name: COLUMN clinical_notes_audit.cna_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.clinical_notes_audit.cna_id IS 'Identificador de la auditoria';

--
-- Name: COLUMN clinical_notes_audit.cn_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.clinical_notes_audit.cn_id IS 'Identificador de la nota clinica';

--
-- Name: COLUMN clinical_notes_audit.psy_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.clinical_notes_audit.psy_id IS 'Identificador del psicologo';

--
-- Name: COLUMN clinical_notes_audit.cna_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.clinical_notes_audit.cna_date IS 'Fecha y hora de la auditoria';

--
-- Name: COLUMN clinical_notes_audit.cna_ip_address; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.clinical_notes_audit.cna_ip_address IS 'Direccion IP del psicologo';

--
-- Name: COLUMN clinical_notes_audit.cna_action; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.clinical_notes_audit.cna_action IS 'Tipo de evento registrado: create (creacion de la nota) o view (consulta/lectura posterior)';

--
-- Name: CONSTRAINT "Clinical_Notes_Audit_action_ck" ON clinical_notes_audit; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT "Clinical_Notes_Audit_action_ck" ON public.clinical_notes_audit IS 'Restringe cna_action a los valores conocidos: create o view';

--
-- Name: clinical_notes_audit_cna_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.clinical_notes_audit ALTER COLUMN cna_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.clinical_notes_audit_cna_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

--
-- Name: clinical_notes_cn_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.clinical_notes ALTER COLUMN cn_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.clinical_notes_cn_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

--
-- Name: content_cards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.content_cards (
    cc_id integer NOT NULL,
    cc_section character varying(20) NOT NULL,
    cc_title character varying(150) NOT NULL,
    cc_subtitle character varying(150),
    cc_description text,
    cc_image_url character varying(500),
    cc_image_alt character varying(150),
    cc_order integer DEFAULT 0 NOT NULL,
    cc_is_active boolean DEFAULT true NOT NULL,
    cc_updated_by integer NOT NULL,
    cc_updated_at timestamp with time zone DEFAULT now() NOT NULL,
    cc_team_group character varying(15),
    cc_facebook_url character varying(300),
    cc_instagram_url character varying(300),
    cc_linkedin_url character varying(300),
    cc_photo_crop_x numeric(5,2),
    cc_photo_crop_y numeric(5,2),
    cc_photo_crop_width numeric(5,2),
    cc_photo_crop_height numeric(5,2),
    CONSTRAINT "Content_Cards_facebook_url_ck" CHECK (((cc_facebook_url)::text ~* '^https://([a-z0-9-]+\.)*facebook\.com/\S+$'::text)),
    CONSTRAINT "Content_Cards_image_alt_ck" CHECK (((cc_image_url IS NULL) OR (cc_image_alt IS NOT NULL))),
    CONSTRAINT "Content_Cards_instagram_url_ck" CHECK (((cc_instagram_url)::text ~* '^https://([a-z0-9-]+\.)*instagram\.com/\S+$'::text)),
    CONSTRAINT "Content_Cards_linkedin_url_ck" CHECK (((cc_linkedin_url)::text ~* '^https://([a-z0-9-]+\.)*linkedin\.com/\S+$'::text)),
    CONSTRAINT "Content_Cards_photo_crop_ck" CHECK ((((cc_photo_crop_x IS NULL) AND (cc_photo_crop_y IS NULL) AND (cc_photo_crop_width IS NULL) AND (cc_photo_crop_height IS NULL)) OR (((cc_section)::text = 'team'::text) AND (cc_image_url IS NOT NULL) AND (cc_photo_crop_x IS NOT NULL) AND (cc_photo_crop_y IS NOT NULL) AND (cc_photo_crop_width IS NOT NULL) AND (cc_photo_crop_height IS NOT NULL) AND (cc_photo_crop_x >= (0)::numeric) AND (cc_photo_crop_y >= (0)::numeric) AND (cc_photo_crop_width > (0)::numeric) AND (cc_photo_crop_height > (0)::numeric) AND ((cc_photo_crop_x + cc_photo_crop_width) <= (100)::numeric) AND ((cc_photo_crop_y + cc_photo_crop_height) <= (100)::numeric)))),
    CONSTRAINT "Content_Cards_section_ck" CHECK (((cc_section)::text = ANY (ARRAY[('values'::character varying)::text, ('team'::character varying)::text, ('services'::character varying)::text, ('programs'::character varying)::text]))),
    CONSTRAINT "Content_Cards_social_section_ck" CHECK ((((cc_section)::text = 'team'::text) OR ((cc_facebook_url IS NULL) AND (cc_instagram_url IS NULL) AND (cc_linkedin_url IS NULL)))),
    CONSTRAINT "Content_Cards_team_group_ck" CHECK (((cc_team_group)::text = ANY ((ARRAY['staff'::character varying, 'professional'::character varying])::text[]))),
    CONSTRAINT "Content_Cards_team_group_section_ck" CHECK ((((cc_section)::text = 'team'::text) = (cc_team_group IS NOT NULL)))
);

--
-- Name: TABLE content_cards; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.content_cards IS 'Elementos en lista del contenido institucional: valores, equipo, servicios y programas';

--
-- Name: COLUMN content_cards.cc_section; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.content_cards.cc_section IS 'Seccion a la que pertenece: values, team, services o programs';

--
-- Name: COLUMN content_cards.cc_title; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.content_cards.cc_title IS 'Titulo del elemento; en team es el nombre de la persona';

--
-- Name: COLUMN content_cards.cc_subtitle; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.content_cards.cc_subtitle IS 'Texto secundario; en team es el cargo';

--
-- Name: COLUMN content_cards.cc_description; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.content_cards.cc_description IS 'Texto descriptivo; en team incluye el perfil profesional y la descripcion de la persona';

--
-- Name: COLUMN content_cards.cc_image_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.content_cards.cc_image_url IS 'URL de la imagen en Cloudinary. No se almacena el binario en la BD';

--
-- Name: COLUMN content_cards.cc_order; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.content_cards.cc_order IS 'Posicion del elemento dentro de su seccion';

--
-- Name: COLUMN content_cards.cc_is_active; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.content_cards.cc_is_active IS 'Indica si el elemento se muestra en el sitio publico';

--
-- Name: COLUMN content_cards.cc_updated_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.content_cards.cc_updated_by IS 'Usuario (administrador o marketing) que realizo la ultima modificacion';

--
-- Name: COLUMN content_cards.cc_team_group; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.content_cards.cc_team_group IS 'Bloque del equipo al que pertenece la persona: staff (equipo de trabajo) o professional (equipo profesional). Obligatorio en team y null en las demas secciones';

--
-- Name: COLUMN content_cards.cc_facebook_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.content_cards.cc_facebook_url IS 'URL opcional del perfil de Facebook de la persona; solo en team. Vacio no se muestra';

--
-- Name: COLUMN content_cards.cc_instagram_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.content_cards.cc_instagram_url IS 'URL opcional del perfil de Instagram de la persona; solo en team. Vacio no se muestra';

--
-- Name: COLUMN content_cards.cc_linkedin_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.content_cards.cc_linkedin_url IS 'URL opcional del perfil de LinkedIn de la persona; solo en team. Vacio no se muestra';

--
-- Name: COLUMN content_cards.cc_photo_crop_x; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.content_cards.cc_photo_crop_x IS 'Inicio horizontal del recorte de la foto circular, en porcentaje del ancho de la imagen original';

--
-- Name: COLUMN content_cards.cc_photo_crop_y; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.content_cards.cc_photo_crop_y IS 'Inicio vertical del recorte de la foto circular, en porcentaje del alto de la imagen original';

--
-- Name: COLUMN content_cards.cc_photo_crop_width; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.content_cards.cc_photo_crop_width IS 'Ancho del recorte de la foto circular, en porcentaje del ancho de la imagen original';

--
-- Name: COLUMN content_cards.cc_photo_crop_height; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.content_cards.cc_photo_crop_height IS 'Alto del recorte de la foto circular, en porcentaje del alto de la imagen original';

--
-- Name: CONSTRAINT "Content_Cards_facebook_url_ck" ON content_cards; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT "Content_Cards_facebook_url_ck" ON public.content_cards IS 'La URL de Facebook debe ser https y pertenecer al dominio facebook.com';

--
-- Name: CONSTRAINT "Content_Cards_instagram_url_ck" ON content_cards; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT "Content_Cards_instagram_url_ck" ON public.content_cards IS 'La URL de Instagram debe ser https y pertenecer al dominio instagram.com';

--
-- Name: CONSTRAINT "Content_Cards_linkedin_url_ck" ON content_cards; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT "Content_Cards_linkedin_url_ck" ON public.content_cards IS 'La URL de LinkedIn debe ser https y pertenecer al dominio linkedin.com';

--
-- Name: CONSTRAINT "Content_Cards_photo_crop_ck" ON content_cards; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT "Content_Cards_photo_crop_ck" ON public.content_cards IS 'El recorte va completo o vacio, solo en team con imagen, y debe quedar dentro de la imagen original';

--
-- Name: CONSTRAINT "Content_Cards_social_section_ck" ON content_cards; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT "Content_Cards_social_section_ck" ON public.content_cards IS 'Las redes sociales solo se registran en la seccion team';

--
-- Name: CONSTRAINT "Content_Cards_team_group_ck" ON content_cards; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT "Content_Cards_team_group_ck" ON public.content_cards IS 'Restringe cc_team_group a los valores conocidos: staff o professional';

--
-- Name: CONSTRAINT "Content_Cards_team_group_section_ck" ON content_cards; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT "Content_Cards_team_group_section_ck" ON public.content_cards IS 'El grupo es obligatorio en team y debe ser null en las demas secciones';

--
-- Name: content_cards_cc_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.content_cards ALTER COLUMN cc_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.content_cards_cc_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

--
-- Name: content_change_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.content_change_log (
    ccl_id integer NOT NULL,
    use_id integer NOT NULL,
    ccl_content_type character varying(20) NOT NULL,
    ccl_content_id integer NOT NULL,
    ccl_action character varying(15) NOT NULL,
    ccl_changed_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "Content_Change_Log_action_ck" CHECK (((ccl_action)::text = ANY (ARRAY[('create'::character varying)::text, ('update'::character varying)::text, ('delete'::character varying)::text, ('publish'::character varying)::text, ('retire'::character varying)::text, ('activate'::character varying)::text, ('deactivate'::character varying)::text, ('pin'::character varying)::text, ('unpin'::character varying)::text]))),
    CONSTRAINT "Content_Change_Log_type_ck" CHECK (((ccl_content_type)::text = ANY (ARRAY[('content_item'::character varying)::text, ('content_card'::character varying)::text, ('news'::character varying)::text, ('gallery_image'::character varying)::text, ('banner'::character varying)::text])))
);

--
-- Name: TABLE content_change_log; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.content_change_log IS 'Tabla intermedia usuarios - contenido: registra quien modifico cada contenido y cuando';

--
-- Name: COLUMN content_change_log.use_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.content_change_log.use_id IS 'Usuario que realizo el cambio';

--
-- Name: COLUMN content_change_log.ccl_content_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.content_change_log.ccl_content_type IS 'Tabla del contenido modificado: content_item, content_card, news, gallery_image o banner';

--
-- Name: COLUMN content_change_log.ccl_content_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.content_change_log.ccl_content_id IS 'Identificador del registro modificado dentro de su tabla';

--
-- Name: COLUMN content_change_log.ccl_action; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.content_change_log.ccl_action IS 'Accion realizada sobre el contenido';

--
-- Name: content_change_log_ccl_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.content_change_log ALTER COLUMN ccl_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.content_change_log_ccl_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

--
-- Name: content_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.content_items (
    ci_id integer NOT NULL,
    ci_key character varying(100) NOT NULL,
    ci_type character varying(10) NOT NULL,
    ci_text_value text,
    ci_image_url character varying(500),
    ci_image_alt character varying(150),
    mar_id integer NOT NULL,
    ci_updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "Content_Items_type_ck" CHECK (((ci_type)::text = ANY (ARRAY[('text'::character varying)::text, ('image'::character varying)::text]))),
    CONSTRAINT "Content_Items_value_ck" CHECK (((((ci_type)::text = 'text'::text) AND (ci_text_value IS NOT NULL) AND (ci_image_url IS NULL)) OR (((ci_type)::text = 'image'::text) AND (ci_image_url IS NOT NULL) AND (ci_text_value IS NULL))))
);

--
-- Name: TABLE content_items; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.content_items IS 'Contenido editable (textos e imagenes) que el rol marketing puede modificar sin requerir despliegue de codigo';

--
-- Name: COLUMN content_items.ci_key; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.content_items.ci_key IS 'Identificador estable usado por el frontend para referenciar este contenido (ej. landing.hero.title, landing.hero.image)';

--
-- Name: COLUMN content_items.ci_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.content_items.ci_type IS 'Tipo de contenido: text o image';

--
-- Name: COLUMN content_items.ci_text_value; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.content_items.ci_text_value IS 'Valor del texto, si ci_type = text';

--
-- Name: COLUMN content_items.ci_image_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.content_items.ci_image_url IS 'URL de la imagen en el bucket/CDN, si ci_type = image. No se almacena el binario en la BD';

--
-- Name: COLUMN content_items.ci_image_alt; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.content_items.ci_image_alt IS 'Texto alternativo de accesibilidad para la imagen, solo aplica si ci_type = image';

--
-- Name: COLUMN content_items.mar_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.content_items.mar_id IS 'Usuario (rol marketing) que realizo la ultima modificacion';

--
-- Name: COLUMN content_items.ci_updated_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.content_items.ci_updated_at IS 'Fecha y hora de la ultima modificacion';

--
-- Name: content_items_ci_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.content_items ALTER COLUMN ci_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.content_items_ci_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

--
-- Name: dependents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dependents (
    dep_id integer NOT NULL,
    dep_identity_document bigint NOT NULL,
    dep_name character varying(100) NOT NULL,
    dep_birthdate date NOT NULL,
    dep_gender character(1),
    CONSTRAINT dependents_gender_ck CHECK ((dep_gender = ANY (ARRAY['F'::bpchar, 'M'::bpchar, 'O'::bpchar, 'P'::bpchar])))
);

--
-- Name: TABLE dependents; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.dependents IS 'Personas menores de edad, dependientes de su tutor legal. Se modelan en una tabla separada de Person (y no como subtipo) porque sus datos requieren tratamiento especial bajo la normativa de proteccion de datos de menores';

--
-- Name: COLUMN dependents.dep_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.dependents.dep_id IS 'Index, identificador de dependiente (menor de edad) (este valor puede asignarse, pero en caso contrario incrementa automaticamente)';

--
-- Name: COLUMN dependents.dep_identity_document; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.dependents.dep_identity_document IS 'Numero del documento de ciudadania';

--
-- Name: COLUMN dependents.dep_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.dependents.dep_name IS 'Nombre del dependiente';

--
-- Name: COLUMN dependents.dep_birthdate; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.dependents.dep_birthdate IS 'Fecha de nacimiento del dependiente';

--
-- Name: COLUMN dependents.dep_gender; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.dependents.dep_gender IS 'Sexo del dependiente: F=Femenino, M=Masculino, O=Otros, P=Prefiero no definir';

--
-- Name: dependents_dep_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.dependents ALTER COLUMN dep_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.dependents_dep_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

--
-- Name: donation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.donation (
    don_id integer NOT NULL,
    don_wompi_transaction_id character varying(100) NOT NULL,
    don_reference character varying(100) NOT NULL,
    don_amount_in_cents bigint NOT NULL,
    don_currency character varying(5) DEFAULT 'COP'::character varying NOT NULL,
    don_status character varying(30) NOT NULL,
    don_payment_method_type character varying(50),
    don_donor_email character varying(150),
    don_donor_full_name character varying(200),
    don_environment character varying(20) DEFAULT 'test'::character varying NOT NULL,
    don_wompi_created_at timestamp with time zone,
    don_created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    don_terms_pd_id integer,
    don_terms_accepted_at timestamp with time zone,
    don_ip_address character varying(50),
    -- Campos conservados del modelo anterior public.donations
    don_donor_id integer NOT NULL,
    don_payment_method_id integer NOT NULL,
    don_description character varying(250),
    CONSTRAINT "Donation_amount_ck" CHECK (don_amount_in_cents > 0),
    CONSTRAINT "Donation_state_ck" CHECK (don_status = ANY (ARRAY['PENDING', 'APPROVED', 'DECLINED', 'VOIDED', 'ERROR']))
);

--
-- Name: COLUMN donation.don_terms_pd_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.donation.don_terms_pd_id IS 'Identificador del documento de condiciones de donacion (donation_terms) que acepto el donante';

--
-- Name: COLUMN donation.don_terms_accepted_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.donation.don_terms_accepted_at IS 'Fecha y hora en la que el donante acepto las condiciones de donacion';

--
-- Name: COLUMN donation.don_ip_address; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.donation.don_ip_address IS 'Direccion IP desde la cual el donante acepto las condiciones de donacion';

--
-- Name: COLUMN donation.don_donor_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.donation.don_donor_id IS 'Identificador del donante; conserva la relacion que existia en public.donations.';

--
-- Name: COLUMN donation.don_payment_method_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.donation.don_payment_method_id IS 'Identificador del metodo de pago; conserva la relacion que existia en public.donations.';

--
-- Name: COLUMN donation.don_description; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.donation.don_description IS 'Mensaje opcional proporcionado por el donante.';

--
-- Name: donation_don_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.donation_don_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: donation_don_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.donation_don_id_seq OWNED BY public.donation.don_id;

--
-- Name: donors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.donors (
    dono_id integer NOT NULL,
    dono_total_amount numeric(20,2),
    dono_email character varying(100) NOT NULL,
    dono_last_donation_date date
);

--
-- Name: TABLE donors; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.donors IS 'Representa a la persona corriente la cual desea realizar una donacion';

--
-- Name: COLUMN donors.dono_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.donors.dono_id IS 'Index, identificador del donador (este valor puede asignarse, pero en caso contrario incrementa automaticamente)';

--
-- Name: COLUMN donors.dono_total_amount; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.donors.dono_total_amount IS 'Atributo calculado, suma las donaciones realizadas';

--
-- Name: COLUMN donors.dono_email; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.donors.dono_email IS 'Correo del donante, subministrado por la API de la pasarela de pagos';

--
-- Name: COLUMN donors.dono_last_donation_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.donors.dono_last_donation_date IS 'Fecha de la ultima donacion realizada';

--
-- Name: donors_dono_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.donors ALTER COLUMN dono_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.donors_dono_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

--
-- Name: email_outbox; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_outbox (
    email_id integer NOT NULL,
    email_to character varying(320),
    email_subject character varying(998),
    email_text text,
    email_html text,
    email_status character varying(10) DEFAULT 'pending'::character varying NOT NULL,
    email_attempts integer DEFAULT 0 NOT NULL,
    email_next_attempt_at timestamp with time zone DEFAULT now() NOT NULL,
    email_locked_at timestamp with time zone,
    email_last_error_code character varying(80),
    email_created_at timestamp with time zone DEFAULT now() NOT NULL,
    email_sent_at timestamp with time zone,
    CONSTRAINT "Email_Outbox_attempts_ck" CHECK ((email_attempts >= 0)),
    CONSTRAINT "Email_Outbox_payload_ck" CHECK (((((email_status)::text = 'sent'::text) AND (email_to IS NOT NULL) AND (email_subject IS NOT NULL) AND (email_text IS NOT NULL)) OR (((email_status)::text = ANY ((ARRAY['sent'::character varying, 'failed'::character varying])::text[])) AND (email_to IS NULL) AND (email_subject IS NULL) AND (email_text IS NULL) AND (email_html IS NULL)) OR (((email_status)::text = ANY ((ARRAY['pending'::character varying, 'sending'::character varying])::text[])) AND (email_to IS NOT NULL) AND (email_subject IS NOT NULL) AND (email_text IS NOT NULL)))),
    CONSTRAINT "Email_Outbox_status_ck" CHECK (((email_status)::text = ANY (ARRAY[('pending'::character varying)::text, ('sending'::character varying)::text, ('sent'::character varying)::text])))
);

--
-- Name: email_outbox_email_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.email_outbox ALTER COLUMN email_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.email_outbox_email_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

--
-- Name: gallery_images; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.gallery_images (
    gi_id integer NOT NULL,
    gi_image_url character varying(500) NOT NULL,
    gi_image_alt character varying(150) NOT NULL,
    gi_caption character varying(200),
    gi_status character varying(10) DEFAULT 'published'::character varying NOT NULL,
    gi_order integer DEFAULT 0 NOT NULL,
    gi_created_by integer NOT NULL,
    gi_updated_by integer NOT NULL,
    gi_updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "Gallery_Images_status_ck" CHECK (((gi_status)::text = ANY (ARRAY[('published'::character varying)::text, ('retired'::character varying)::text])))
);

--
-- Name: TABLE gallery_images; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.gallery_images IS 'Imagenes de la galeria del sitio publico';

--
-- Name: COLUMN gallery_images.gi_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.gallery_images.gi_status IS 'published se muestra en el sitio; retired se oculta pero se conserva';

--
-- Name: COLUMN gallery_images.gi_order; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.gallery_images.gi_order IS 'Posicion de la imagen en la galeria';

--
-- Name: gallery_images_gi_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.gallery_images ALTER COLUMN gi_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.gallery_images_gi_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

--
-- Name: news; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.news (
    nw_id integer NOT NULL,
    nw_title character varying(150) NOT NULL,
    nw_body text NOT NULL,
    nw_image_url character varying(500),
    nw_image_alt character varying(150),
    nw_status character varying(10) DEFAULT 'published'::character varying NOT NULL,
    nw_published_at timestamp with time zone DEFAULT now() NOT NULL,
    nw_is_pinned boolean DEFAULT false NOT NULL,
    nw_created_by integer NOT NULL,
    nw_updated_by integer NOT NULL,
    nw_updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "News_image_alt_ck" CHECK (((nw_image_url IS NULL) OR (nw_image_alt IS NOT NULL))),
    CONSTRAINT "News_pinned_published_ck" CHECK (((NOT nw_is_pinned) OR ((nw_status)::text = 'published'::text))),
    CONSTRAINT "News_status_ck" CHECK (((nw_status)::text = ANY (ARRAY[('published'::character varying)::text, ('retired'::character varying)::text])))
);

--
-- Name: TABLE news; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.news IS 'Noticias publicadas por administrador o marketing en el sitio publico';

--
-- Name: COLUMN news.nw_body; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.news.nw_body IS 'Contenido en Markdown limitado: negrita, cursiva y enlaces';

--
-- Name: COLUMN news.nw_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.news.nw_status IS 'published se muestra en el sitio; retired se oculta pero se conserva';

--
-- Name: COLUMN news.nw_published_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.news.nw_published_at IS 'Fecha de publicacion; se asigna al crear y no se edita';

--
-- Name: COLUMN news.nw_is_pinned; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.news.nw_is_pinned IS 'Noticia fijada: se muestra primera. Solo puede haber una';

--
-- Name: news_nw_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.news ALTER COLUMN nw_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.news_nw_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

--
-- Name: payment_method; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_method (
    pmet_id integer NOT NULL,
    pmet_is_active boolean DEFAULT true NOT NULL,
    pmet_name character varying(25) NOT NULL
);

--
-- Name: TABLE payment_method; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.payment_method IS 'Representa al metodo de pago con el cual se puede realizar una donacion';

--
-- Name: COLUMN payment_method.pmet_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.payment_method.pmet_id IS 'Index, identificador del metodo de pago';

--
-- Name: COLUMN payment_method.pmet_is_active; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.payment_method.pmet_is_active IS 'Estado en el cual se indica si un metodo de pago puede ser usado';

--
-- Name: COLUMN payment_method.pmet_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.payment_method.pmet_name IS 'Nombre del servicio usado';

--
-- Name: person; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.person (
    per_id integer NOT NULL,
    per_name character varying(100) NOT NULL,
    per_identity_document bigint,
    per_email character varying(100) NOT NULL,
    per_contact_number bigint,
    per_state character varying(15) DEFAULT 'activo'::character varying NOT NULL,
    per_update_date timestamp with time zone,
    per_created_by integer,
    per_created_at timestamp with time zone DEFAULT now() NOT NULL,
    per_birthdate date,
    per_gender character(1),
    per_card_type character varying(20),
    per_municipality character varying(100),
    per_department character varying(100),
    per_residence_zone character varying(255),
    per_vulnerabilities character varying(75)[],
    CONSTRAINT "Person_state_ck" CHECK (((per_state)::text = ANY (ARRAY[('activo'::character varying)::text, ('inactivo'::character varying)::text, ('bloqueado'::character varying)::text, ('pendiente'::character varying)::text]))),
    CONSTRAINT person_card_type_ck CHECK (((per_card_type)::text = ANY (ARRAY[('CC'::character varying)::text, ('TI'::character varying)::text, ('CE'::character varying)::text]))),
    CONSTRAINT person_gender_ck CHECK ((per_gender = ANY (ARRAY['F'::bpchar, 'M'::bpchar, 'O'::bpchar, 'P'::bpchar])))
);

--
-- Name: TABLE person; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.person IS 'Representa a la persona corriente';

--
-- Name: COLUMN person.per_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.person.per_id IS 'Index, identificador de persona (este valor puede asignarse, pero en caso contrario incrementa automaticamente)';

--
-- Name: COLUMN person.per_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.person.per_name IS 'Nombre de la persona';

--
-- Name: COLUMN person.per_identity_document; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.person.per_identity_document IS 'Numero del documento de ciudadania';

--
-- Name: COLUMN person.per_email; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.person.per_email IS 'Correo electronico de la persona';

--
-- Name: COLUMN person.per_contact_number; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.person.per_contact_number IS 'Numero de telefono mobil';

--
-- Name: COLUMN person.per_state; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.person.per_state IS 'Estado actual de la cuenta';

--
-- Name: COLUMN person.per_update_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.person.per_update_date IS 'Fecha y hora en la cual se concreto una actualizacion de los datos de una persona';

--
-- Name: COLUMN person.per_birthdate; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.person.per_birthdate IS 'Fecha de nacimiento de la persona';

--
-- Name: COLUMN person.per_gender; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.person.per_gender IS 'Sexo de la persona: F=Femenino, M=Masculino, O=Otros, P=Prefiero no definir';

--
-- Name: COLUMN person.per_card_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.person.per_card_type IS 'Tipo de tarjeta de identidad: CC, TI, CE';

--
-- Name: COLUMN person.per_municipality; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.person.per_municipality IS 'Municipio de residencia del consultante';

--
-- Name: COLUMN person.per_department; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.person.per_department IS 'Departamento de residencia del consultante';

--
-- Name: COLUMN person.per_residence_zone; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.person.per_residence_zone IS 'Zona de residencia de la persona registrada en la solicitud de cita';

--
-- Name: person_per_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.person ALTER COLUMN per_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.person_per_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

--
-- Name: person_rol; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.person_rol (
    per_id integer NOT NULL,
    rol_id integer NOT NULL,
    pr_assigned_at timestamp with time zone NOT NULL,
    pr_active boolean DEFAULT true NOT NULL
);

--
-- Name: TABLE person_rol; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.person_rol IS 'Tabla intermedia que vincula las personas con su/sus rol/roles';

--
-- Name: COLUMN person_rol.per_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.person_rol.per_id IS 'Identificador de la persona';

--
-- Name: COLUMN person_rol.rol_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.person_rol.rol_id IS 'Identificador del rol';

--
-- Name: COLUMN person_rol.pr_assigned_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.person_rol.pr_assigned_at IS 'Fecha y hora de la asignacion de un rol a una persona';

--
-- Name: COLUMN person_rol.pr_active; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.person_rol.pr_active IS 'Indica si el rol asignado esta activo (se puede desactivar sin quitarlo)';

--
-- Name: policy_acceptance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.policy_acceptance (
    pa_id integer NOT NULL,
    per_id integer NOT NULL,
    dep_id integer,
    cn_id integer,
    pd_id integer NOT NULL,
    pa_accepted_at timestamp with time zone DEFAULT now() NOT NULL,
    pa_ip_address character varying(50),
    app_id integer,
    pa_channel character varying(15) DEFAULT 'web'::character varying NOT NULL,
    pa_registered_by integer,
    CONSTRAINT "Policy_Acceptance_channel_ck" CHECK (((pa_channel)::text = ANY ((ARRAY['web'::character varying, 'telefono'::character varying, 'whatsapp'::character varying, 'presencial'::character varying])::text[])))
);

--
-- Name: TABLE policy_acceptance; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.policy_acceptance IS 'Registro de cada aceptacion de politica. El actor siempre es una persona (per_id); dep_id y cn_id son contexto opcional segun el caso';

--
-- Name: COLUMN policy_acceptance.pa_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.policy_acceptance.pa_id IS 'Index, identificador del registro de aceptacion (incrementa automaticamente)';

--
-- Name: COLUMN policy_acceptance.per_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.policy_acceptance.per_id IS 'Identificador de la persona que acepta (siempre presente, incluso cuando la aceptacion es en nombre de un dependiente)';

--
-- Name: COLUMN policy_acceptance.dep_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.policy_acceptance.dep_id IS 'Identificador del dependiente, si la aceptacion fue realizada por su tutor en nombre de este';

--
-- Name: COLUMN policy_acceptance.cn_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.policy_acceptance.cn_id IS 'Identificador de la nota clinica, si la aceptacion esta asociada a una nota puntual';

--
-- Name: COLUMN policy_acceptance.pd_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.policy_acceptance.pd_id IS 'Identificador del documento de politica (tipo + version) que fue aceptado';

--
-- Name: COLUMN policy_acceptance.pa_accepted_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.policy_acceptance.pa_accepted_at IS 'Fecha y hora en la que se registro la aceptacion';

--
-- Name: COLUMN policy_acceptance.pa_ip_address; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.policy_acceptance.pa_ip_address IS 'Direccion IP desde la cual se realizo la aceptacion';

--
-- Name: COLUMN policy_acceptance.app_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.policy_acceptance.app_id IS 'Identificador de la solicitud de cita a la que corresponde esta aceptacion. El consultante no tiene cuenta persistente, por lo que cada solicitud (para si mismo o para un dependiente) exige una nueva aceptacion de los terminos vigentes en ese momento';

--
-- Name: COLUMN policy_acceptance.pa_channel; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.policy_acceptance.pa_channel IS 'Canal por el cual se obtuvo la aceptacion: web (la persona acepto en la plataforma), telefono, whatsapp o presencial (registrada por el personal)';

--
-- Name: COLUMN policy_acceptance.pa_registered_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.policy_acceptance.pa_registered_by IS 'Identificador del usuario del personal que registro la aceptacion obtenida por telefono, whatsapp o en persona; null cuando la persona acepto directamente en la web';

--
-- Name: CONSTRAINT "Policy_Acceptance_channel_ck" ON policy_acceptance; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT "Policy_Acceptance_channel_ck" ON public.policy_acceptance IS 'Restringe pa_channel a los valores conocidos: web, telefono, whatsapp o presencial';

--
-- Name: policy_acceptance_pa_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.policy_acceptance ALTER COLUMN pa_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.policy_acceptance_pa_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

--
-- Name: policy_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.policy_documents (
    pd_id integer NOT NULL,
    pd_type character varying(30) NOT NULL,
    pd_version character varying(50) NOT NULL,
    pd_content text NOT NULL,
    pd_effective_from timestamp with time zone DEFAULT now() NOT NULL
);

--
-- Name: TABLE policy_documents; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.policy_documents IS 'Contenido versionado e inmutable de cada politica de terminos y condiciones. Cada version nueva es una fila nueva, nunca se sobreescribe una version existente';

--
-- Name: COLUMN policy_documents.pd_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.policy_documents.pd_id IS 'Index, identificador del documento de politica (incrementa automaticamente)';

--
-- Name: COLUMN policy_documents.pd_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.policy_documents.pd_type IS 'Tipo de politica: data_treatment, dependent_consent, schedule_terms, clinical_note_terms, entre otros';

--
-- Name: COLUMN policy_documents.pd_version; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.policy_documents.pd_version IS 'Version de la politica dentro de su tipo (ej. v1.0, v1.1)';

--
-- Name: COLUMN policy_documents.pd_content; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.policy_documents.pd_content IS 'Texto completo de la politica en la version indicada';

--
-- Name: COLUMN policy_documents.pd_effective_from; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.policy_documents.pd_effective_from IS 'Fecha y hora desde la cual esta version es la vigente';

--
-- Name: policy_documents_pd_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.policy_documents ALTER COLUMN pd_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.policy_documents_pd_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

--
-- Name: psychologist; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.psychologist (
    psy_id integer NOT NULL,
    psy_license_number integer NOT NULL,
    psy_speciality character varying(45) NOT NULL
);

--
-- Name: TABLE psychologist; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.psychologist IS 'Representa al usuario el cual tiene como rol psicologo';

--
-- Name: COLUMN psychologist.psy_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.psychologist.psy_id IS 'Index, identificador del psicologo, proviene de usuario';

--
-- Name: COLUMN psychologist.psy_license_number; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.psychologist.psy_license_number IS 'El numero de licencia medico profesional para psicologos';

--
-- Name: COLUMN psychologist.psy_speciality; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.psychologist.psy_speciality IS 'Especialidad profesional del psicologo';

--
-- Name: relationship; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.relationship (
    rel_id integer NOT NULL,
    rel_description character varying(25) NOT NULL
);

--
-- Name: TABLE relationship; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.relationship IS 'Tipos de relacion que tiene un menor de edad con su tutor legal';

--
-- Name: COLUMN relationship.rel_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.relationship.rel_id IS 'Index, identificador de relacion/parentesco';

--
-- Name: COLUMN relationship.rel_description; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.relationship.rel_description IS 'Descripcion o nombre del parentesco del consultante hacia el menor';

--
-- Name: requester_dependent; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.requester_dependent (
    req_id integer NOT NULL,
    dep_id integer NOT NULL,
    rel_id integer,
    rd_assigned_at timestamp with time zone NOT NULL
);

--
-- Name: TABLE requester_dependent; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.requester_dependent IS 'Tabla intermedia, vincula los consultantes con los menores de edad segun su parentesco';

--
-- Name: COLUMN requester_dependent.req_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.requester_dependent.req_id IS 'Identificador del consultante';

--
-- Name: COLUMN requester_dependent.dep_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.requester_dependent.dep_id IS 'Identificador del dependiente (menor de edad)';

--
-- Name: COLUMN requester_dependent.rel_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.requester_dependent.rel_id IS 'Identificador de la relacion (parentesco)';

--
-- Name: COLUMN requester_dependent.rd_assigned_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.requester_dependent.rd_assigned_at IS 'Fecha y hora en la que un consultante registro a un menor de idad y definio su parentesco con este';

--
-- Name: rol; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rol (
    rol_id integer NOT NULL,
    rol_description character varying(25) NOT NULL
);

--
-- Name: TABLE rol; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.rol IS 'Clasificaccion de la persona la cual le brinda ciertos privilegios y responsabilidades';

--
-- Name: COLUMN rol.rol_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rol.rol_id IS 'Index, identificador de rol';

--
-- Name: COLUMN rol.rol_description; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.rol.rol_description IS 'Descripcion o nombre del rol';

--
-- Name: schedule; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schedule (
    sch_id integer NOT NULL,
    psy_id integer NOT NULL,
    sch_date date NOT NULL,
    sch_start_time time without time zone NOT NULL,
    sch_end_time time without time zone NOT NULL,
    CONSTRAINT "Schedule_time_ck" CHECK ((sch_end_time > sch_start_time))
);

--
-- Name: TABLE schedule; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.schedule IS 'Representa los bloques grandes de disponibilidad del psicologo; la ocupacion efectiva se calcula restando los intervalos registrados en schedule_occupancy';

--
-- Name: COLUMN schedule.sch_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.schedule.sch_id IS 'Index, identificador de la agenda o franja horaria (este valor puede asignarse, pero en caso contrario incrementa automaticamente)';

--
-- Name: COLUMN schedule.psy_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.schedule.psy_id IS 'Identificador del psicologo';

--
-- Name: COLUMN schedule.sch_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.schedule.sch_date IS 'Fecha en la que el psicologo indica su indospinibilidad';

--
-- Name: COLUMN schedule.sch_start_time; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.schedule.sch_start_time IS 'Hora inicial en la que el psicologo indica su indospinibilidad';

--
-- Name: COLUMN schedule.sch_end_time; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.schedule.sch_end_time IS 'Hora final en la que el psicologo indica su indospinibilidad';

--
-- Name: CONSTRAINT "Schedule_time_ck" ON schedule; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT "Schedule_time_ck" ON public.schedule IS 'Restriccion que obliga a que la hora de finalizacion sea posterior a la de inicio';

--
-- Name: schedule_occupancy; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schedule_occupancy (
    occ_id integer NOT NULL,
    psy_id integer NOT NULL,
    app_id integer,
    occ_date date NOT NULL,
    occ_start_time time without time zone NOT NULL,
    occ_end_time time without time zone NOT NULL,
    source_type character varying(20) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "ScheduleOccupancy_source_ck" CHECK (((source_type)::text = ANY (ARRAY[('appointment'::character varying)::text, ('manual'::character varying)::text]))),
    CONSTRAINT "ScheduleOccupancy_time_ck" CHECK ((occ_end_time > occ_start_time))
);

--
-- Name: TABLE schedule_occupancy; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.schedule_occupancy IS 'Intervalos concretos de ocupacion del psicologo. Cada fila representa un rango de tiempo no disponible, generado por una cita asignada o por un bloqueo manual del psicologo';

--
-- Name: COLUMN schedule_occupancy.occ_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.schedule_occupancy.occ_id IS 'Identificador del bloqueo de ocupacion';

--
-- Name: COLUMN schedule_occupancy.psy_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.schedule_occupancy.psy_id IS 'Identificador del psicologo al que pertenece el intervalo ocupado';

--
-- Name: COLUMN schedule_occupancy.app_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.schedule_occupancy.app_id IS 'Identificador de la cita si el bloqueo proviene de una cita; null si la ocupacion es manual';

--
-- Name: COLUMN schedule_occupancy.occ_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.schedule_occupancy.occ_date IS 'Fecha del rango ocupado';

--
-- Name: COLUMN schedule_occupancy.occ_start_time; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.schedule_occupancy.occ_start_time IS 'Hora de inicio del bloqueo ocupado';

--
-- Name: COLUMN schedule_occupancy.occ_end_time; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.schedule_occupancy.occ_end_time IS 'Hora final del bloqueo ocupado';

--
-- Name: COLUMN schedule_occupancy.source_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.schedule_occupancy.source_type IS 'Origen del bloqueo: appointment (cita) o manual (bloqueo hecho por el psicologo o secretaria)';

--
-- Name: COLUMN schedule_occupancy.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.schedule_occupancy.created_at IS 'Fecha y hora de creacion del bloqueo de ocupacion';

--
-- Name: CONSTRAINT "ScheduleOccupancy_source_ck" ON schedule_occupancy; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT "ScheduleOccupancy_source_ck" ON public.schedule_occupancy IS 'Los bloqueos ocupados solo pueden originarse en cita o bloqueo manual';

--
-- Name: CONSTRAINT "ScheduleOccupancy_time_ck" ON schedule_occupancy; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT "ScheduleOccupancy_time_ck" ON public.schedule_occupancy IS 'El fin del bloqueo debe ser posterior al inicio';

--
-- Name: schedule_occupancy_occ_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.schedule_occupancy ALTER COLUMN occ_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.schedule_occupancy_occ_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

--
-- Name: schedule_recurring_blocks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schedule_recurring_blocks (
    srb_id integer NOT NULL,
    psy_id integer NOT NULL,
    srb_day_of_week smallint NOT NULL,
    srb_start_time time without time zone NOT NULL,
    srb_end_time time without time zone NOT NULL,
    srb_valid_from date NOT NULL,
    srb_valid_until date,
    srb_active boolean DEFAULT true NOT NULL,
    CONSTRAINT "Schedule_Recurring_Block_Date_ck" CHECK (((srb_valid_until IS NULL) OR (srb_valid_until >= srb_valid_from))),
    CONSTRAINT "Schedule_Recurring_Block_Day_ck" CHECK (((srb_day_of_week >= 1) AND (srb_day_of_week <= 7))),
    CONSTRAINT "Schedule_Recurring_Block_Time_ck" CHECK ((srb_end_time > srb_start_time))
);

--
-- Name: schedule_recurring_blocks_srb_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.schedule_recurring_blocks ALTER COLUMN srb_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.schedule_recurring_blocks_srb_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

--
-- Name: schedule_sch_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.schedule ALTER COLUMN sch_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.schedule_sch_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

--
-- Name: security_access_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.security_access_log (
    security_access_log_id integer NOT NULL,
    use_id integer NOT NULL,
    security_access_log_section character varying(100) NOT NULL,
    security_access_log_message character varying(255) NOT NULL,
    security_access_log_created_at timestamp with time zone DEFAULT now() NOT NULL
);

--
-- Name: TABLE security_access_log; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.security_access_log IS 'Registro de seguridad: avisos generados por el sistema cuando un usuario intenta acceder a una seccion para la cual no tiene permisos';

--
-- Name: COLUMN security_access_log.security_access_log_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.security_access_log.security_access_log_id IS 'Index, identificador del registro de seguridad (incrementa automaticamente)';

--
-- Name: COLUMN security_access_log.use_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.security_access_log.use_id IS 'Identificador del usuario que intento acceder a la seccion no autorizada';

--
-- Name: COLUMN security_access_log.security_access_log_section; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.security_access_log.security_access_log_section IS 'Seccion, ruta o recurso al cual el usuario intento acceder sin autorizacion';

--
-- Name: COLUMN security_access_log.security_access_log_message; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.security_access_log.security_access_log_message IS 'Mensaje o aviso generado por el sistema al detectar el intento de acceso no autorizado';

--
-- Name: COLUMN security_access_log.security_access_log_created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.security_access_log.security_access_log_created_at IS 'Fecha y hora en la que se genero el aviso de seguridad';

--
-- Name: security_access_log_security_access_log_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.security_access_log ALTER COLUMN security_access_log_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.security_access_log_security_access_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    use_id integer NOT NULL,
    user_provider_id character varying(255) NOT NULL,
    user_provider_name character varying(25) NOT NULL,
    user_last_login_at timestamp with time zone,
    user_email_verified boolean DEFAULT false NOT NULL
);

--
-- Name: TABLE users; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.users IS 'Representa a la persona con cuenta dentro del sistema';

--
-- Name: COLUMN users.use_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.users.use_id IS 'Index identificador del usuario (proviende de persona)';

--
-- Name: COLUMN users.user_provider_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.users.user_provider_id IS 'El identificador que fue dado/asignado por OAuth';

--
-- Name: COLUMN users.user_provider_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.users.user_provider_name IS 'El nombre del proovedor con el cual se hizo el inicio de sesion';

--
-- Name: COLUMN users.user_last_login_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.users.user_last_login_at IS 'Fecha y hora del ultimo inicio de sesion exitoso del usuario a traves de OAuth';

--
-- Name: donation don_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.donation ALTER COLUMN don_id SET DEFAULT nextval('public.donation_don_id_seq'::regclass);

--
-- Name: appointment_assignment_history Appointment_Assignment_History_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointment_assignment_history
    ADD CONSTRAINT "Appointment_Assignment_History_pk" PRIMARY KEY (aah_id);

--
-- Name: appointments Appointments_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT "Appointments_pk" PRIMARY KEY (app_id);

--
-- Name: CONSTRAINT "Appointments_pk" ON appointments; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT "Appointments_pk" ON public.appointments IS 'Restriccion de identificador unico de cita';

--
-- Name: banners Banners_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.banners
    ADD CONSTRAINT "Banners_pk" PRIMARY KEY (ban_id);

--
-- Name: clinical_notes_audit Clinical_Notes_Audit_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinical_notes_audit
    ADD CONSTRAINT "Clinical_Notes_Audit_pk" PRIMARY KEY (cna_id);

--
-- Name: clinical_notes Clinical_Notes_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinical_notes
    ADD CONSTRAINT "Clinical_Notes_pk" PRIMARY KEY (cn_id);

--
-- Name: content_cards Content_Cards_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_cards
    ADD CONSTRAINT "Content_Cards_pk" PRIMARY KEY (cc_id);

--
-- Name: content_change_log Content_Change_Log_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_change_log
    ADD CONSTRAINT "Content_Change_Log_pk" PRIMARY KEY (ccl_id);

--
-- Name: content_items Content_Items_key_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_items
    ADD CONSTRAINT "Content_Items_key_uq" UNIQUE (ci_key);

--
-- Name: content_items Content_Items_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_items
    ADD CONSTRAINT "Content_Items_pk" PRIMARY KEY (ci_id);

--
-- Name: dependents Dependent_idocument_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dependents
    ADD CONSTRAINT "Dependent_idocument_uq" UNIQUE (dep_identity_document);

--
-- Name: CONSTRAINT "Dependent_idocument_uq" ON dependents; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT "Dependent_idocument_uq" ON public.dependents IS 'Restriccion que impide la repeticion de los documentos de identidad';

--
-- Name: dependents Dependents_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dependents
    ADD CONSTRAINT "Dependents_pk" PRIMARY KEY (dep_id);

--
-- Name: CONSTRAINT "Dependents_pk" ON dependents; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT "Dependents_pk" ON public.dependents IS 'Restriccion de identificador unico de dependiente';

--
-- Name: donors Donor_email_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.donors
    ADD CONSTRAINT "Donor_email_uq" UNIQUE (dono_email);

--
-- Name: CONSTRAINT "Donor_email_uq" ON donors; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT "Donor_email_uq" ON public.donors IS 'Restriccion que impide la repeticion del correo de los donantes';

--
-- Name: donors Donors_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.donors
    ADD CONSTRAINT "Donors_pk" PRIMARY KEY (dono_id);

--
-- Name: CONSTRAINT "Donors_pk" ON donors; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT "Donors_pk" ON public.donors IS 'Restriccion de identificador unico de donador';

--
-- Name: email_outbox Email_Outbox_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_outbox
    ADD CONSTRAINT "Email_Outbox_pk" PRIMARY KEY (email_id);

--
-- Name: gallery_images Gallery_Images_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gallery_images
    ADD CONSTRAINT "Gallery_Images_pk" PRIMARY KEY (gi_id);

--
-- Name: news News_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news
    ADD CONSTRAINT "News_pk" PRIMARY KEY (nw_id);

--
-- Name: payment_method Payment_Method_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_method
    ADD CONSTRAINT "Payment_Method_pk" PRIMARY KEY (pmet_id);

--
-- Name: CONSTRAINT "Payment_Method_pk" ON payment_method; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT "Payment_Method_pk" ON public.payment_method IS 'Restriccion de identificador unico del metodo de pago';

--
-- Name: person_rol Person_Roles_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.person_rol
    ADD CONSTRAINT "Person_Roles_pk" PRIMARY KEY (per_id, rol_id);

--
-- Name: CONSTRAINT "Person_Roles_pk" ON person_rol; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT "Person_Roles_pk" ON public.person_rol IS 'Restriccion de identificacion unico compuesto con la id de la persona y rol';

--
-- Name: person Person_idocument_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.person
    ADD CONSTRAINT "Person_idocument_uq" UNIQUE (per_identity_document);

--
-- Name: CONSTRAINT "Person_idocument_uq" ON person; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT "Person_idocument_uq" ON public.person IS 'Restriccion que impidela repeticion de un documento de identidad';

--
-- Name: person Person_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.person
    ADD CONSTRAINT "Person_pk" PRIMARY KEY (per_id);

--
-- Name: CONSTRAINT "Person_pk" ON person; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT "Person_pk" ON public.person IS 'Restriccion de identificador unico para persona';

--
-- Name: policy_acceptance Policy_Acceptance_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.policy_acceptance
    ADD CONSTRAINT "Policy_Acceptance_pk" PRIMARY KEY (pa_id);

--
-- Name: CONSTRAINT "Policy_Acceptance_pk" ON policy_acceptance; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT "Policy_Acceptance_pk" ON public.policy_acceptance IS 'Restriccion de identificador unico del registro de aceptacion';

--
-- Name: policy_documents Policy_Documents_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.policy_documents
    ADD CONSTRAINT "Policy_Documents_pk" PRIMARY KEY (pd_id);

--
-- Name: CONSTRAINT "Policy_Documents_pk" ON policy_documents; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT "Policy_Documents_pk" ON public.policy_documents IS 'Restriccion de identificador unico del documento de politica';

--
-- Name: policy_documents Policy_Documents_type_version_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.policy_documents
    ADD CONSTRAINT "Policy_Documents_type_version_uq" UNIQUE (pd_type, pd_version);

--
-- Name: CONSTRAINT "Policy_Documents_type_version_uq" ON policy_documents; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT "Policy_Documents_type_version_uq" ON public.policy_documents IS 'Impide repetir el mismo numero de version dentro de un mismo tipo de politica';

--
-- Name: psychologist Psychologist_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.psychologist
    ADD CONSTRAINT "Psychologist_pk" PRIMARY KEY (psy_id);

--
-- Name: CONSTRAINT "Psychologist_pk" ON psychologist; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT "Psychologist_pk" ON public.psychologist IS 'Restriccion de identificador unico de psicologo';

--
-- Name: relationship Relationship_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.relationship
    ADD CONSTRAINT "Relationship_pk" PRIMARY KEY (rel_id);

--
-- Name: CONSTRAINT "Relationship_pk" ON relationship; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT "Relationship_pk" ON public.relationship IS 'Identificador unico de la relacion';

--
-- Name: requester_dependent Requester_Dependent_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.requester_dependent
    ADD CONSTRAINT "Requester_Dependent_pk" PRIMARY KEY (req_id, dep_id);

--
-- Name: CONSTRAINT "Requester_Dependent_pk" ON requester_dependent; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT "Requester_Dependent_pk" ON public.requester_dependent IS 'Restriccion Identificador unico que junta el id de un consultante y un dependiente';

--
-- Name: rol Rol_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rol
    ADD CONSTRAINT "Rol_pk" PRIMARY KEY (rol_id);

--
-- Name: CONSTRAINT "Rol_pk" ON rol; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT "Rol_pk" ON public.rol IS 'Restriccion de identificador unico de rol';

--
-- Name: schedule_occupancy ScheduleOccupancy_app_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_occupancy
    ADD CONSTRAINT "ScheduleOccupancy_app_unique" UNIQUE (app_id);

--
-- Name: CONSTRAINT "ScheduleOccupancy_app_unique" ON schedule_occupancy; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT "ScheduleOccupancy_app_unique" ON public.schedule_occupancy IS 'Una cita no puede crear mas de un bloqueo de ocupacion';

--
-- Name: schedule_occupancy ScheduleOccupancy_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_occupancy
    ADD CONSTRAINT "ScheduleOccupancy_pk" PRIMARY KEY (occ_id);

--
-- Name: CONSTRAINT "ScheduleOccupancy_pk" ON schedule_occupancy; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT "ScheduleOccupancy_pk" ON public.schedule_occupancy IS 'Restriccion de identificador unico del bloqueo ocupado';

--
-- Name: schedule_recurring_blocks Schedule_Recurring_Block_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_recurring_blocks
    ADD CONSTRAINT "Schedule_Recurring_Block_pk" PRIMARY KEY (srb_id);

--
-- Name: schedule Schedule_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule
    ADD CONSTRAINT "Schedule_pk" PRIMARY KEY (sch_id);

--
-- Name: CONSTRAINT "Schedule_pk" ON schedule; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT "Schedule_pk" ON public.schedule IS 'Restriccion de identificador unico de agenda';

--
-- Name: security_access_log Security_Access_Log_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.security_access_log
    ADD CONSTRAINT "Security_Access_Log_pk" PRIMARY KEY (security_access_log_id);

--
-- Name: CONSTRAINT "Security_Access_Log_pk" ON security_access_log; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT "Security_Access_Log_pk" ON public.security_access_log IS 'Restriccion de identificador unico del registro de seguridad';

--
-- Name: users User_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "User_pk" PRIMARY KEY (use_id);

--
-- Name: CONSTRAINT "User_pk" ON users; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT "User_pk" ON public.users IS 'Restriccion de identificador unico de usuario';

--
-- Name: users User_provider_uq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "User_provider_uq" UNIQUE (user_provider_id);

--
-- Name: CONSTRAINT "User_provider_uq" ON users; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT "User_provider_uq" ON public.users IS 'Garantiza unicidad global del sub entregado por Auth0; ya no depende de provider_name, que se conserva solo con fines informativos/filtrado';

--
-- Name: care_packages care_packages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.care_packages
    ADD CONSTRAINT care_packages_pkey PRIMARY KEY (cp_id);

--
-- Name: donation donation_don_wompi_transaction_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.donation
    ADD CONSTRAINT donation_don_wompi_transaction_id_key UNIQUE (don_wompi_transaction_id);

--
-- Name: donation donation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.donation
    ADD CONSTRAINT donation_pkey PRIMARY KEY (don_id);

--
-- Name: Appointment_Assignment_History_appointment_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Appointment_Assignment_History_appointment_idx" ON public.appointment_assignment_history USING btree (app_id);

--
-- Name: Appointment_Assignment_History_changed_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Appointment_Assignment_History_changed_at_idx" ON public.appointment_assignment_history USING btree (aah_changed_at);

--
-- Name: Appointment_Assignment_History_psychologist_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Appointment_Assignment_History_psychologist_idx" ON public.appointment_assignment_history USING btree (new_psy_id);

--
-- Name: Appointment_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Appointment_created_idx" ON public.appointments USING btree (app_created_at);

--
-- Name: Appointment_patient_dependent_completed_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Appointment_patient_dependent_completed_idx" ON public.appointments USING btree (app_patient_dependent_id, app_date, app_id) WHERE ((app_patient_dependent_id IS NOT NULL) AND ((app_state)::text = 'realizada'::text) AND (psy_id IS NOT NULL));

--
-- Name: Appointment_patient_person_completed_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Appointment_patient_person_completed_idx" ON public.appointments USING btree (app_patient_person_id, app_date, app_id) WHERE ((app_patient_person_id IS NOT NULL) AND ((app_state)::text = 'realizada'::text) AND (psy_id IS NOT NULL));

--
-- Name: Appointment_psy_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Appointment_psy_idx" ON public.appointments USING btree (psy_id);

--
-- Name: Appointment_req_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Appointment_req_idx" ON public.appointments USING btree (req_id);

--
-- Name: Appointment_state_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Appointment_state_idx" ON public.appointments USING btree (app_state);

--
-- Name: Clinical_Notes_appointment_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Clinical_Notes_appointment_idx" ON public.clinical_notes USING btree (app_id);

--
-- Name: Clinical_Notes_psychologist_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Clinical_Notes_psychologist_idx" ON public.clinical_notes USING btree (psy_id);

--
-- Name: Content_Cards_section_order_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Content_Cards_section_order_idx" ON public.content_cards USING btree (cc_section, cc_order);

--
-- Name: Content_Change_Log_content_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Content_Change_Log_content_idx" ON public.content_change_log USING btree (ccl_content_type, ccl_content_id, ccl_changed_at DESC);

--
-- Name: Content_Change_Log_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Content_Change_Log_user_idx" ON public.content_change_log USING btree (use_id);

--
-- Name: Content_Items_key_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Content_Items_key_idx" ON public.content_items USING btree (ci_key);

--
-- Name: Email_Outbox_pending_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Email_Outbox_pending_idx" ON public.email_outbox USING btree (email_status, email_next_attempt_at, email_created_at);

--
-- Name: Email_Outbox_stale_lock_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Email_Outbox_stale_lock_idx" ON public.email_outbox USING btree (email_locked_at) WHERE ((email_status)::text = 'sending'::text);

--
-- Name: Gallery_Images_status_order_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Gallery_Images_status_order_idx" ON public.gallery_images USING btree (gi_status, gi_order);

--
-- Name: News_single_pinned_uq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "News_single_pinned_uq" ON public.news USING btree (nw_is_pinned) WHERE nw_is_pinned;

--
-- Name: News_status_published_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "News_status_published_idx" ON public.news USING btree (nw_status, nw_published_at DESC);

--
-- Name: Person_email_uq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Person_email_uq" ON public.person USING btree (lower((per_email)::text));

--
-- Name: INDEX "Person_email_uq"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public."Person_email_uq" IS 'Unicidad y busqueda case-insensitive del correo; evita duplicar persona por diferencias de mayusculas entre proveedores OAuth';

--
-- Name: Policy_Acceptance_appointment_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Policy_Acceptance_appointment_idx" ON public.policy_acceptance USING btree (app_id);

--
-- Name: Policy_Acceptance_note_version_uq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Policy_Acceptance_note_version_uq" ON public.policy_acceptance USING btree (cn_id, pd_id) WHERE (cn_id IS NOT NULL);

--
-- Name: INDEX "Policy_Acceptance_note_version_uq"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public."Policy_Acceptance_note_version_uq" IS 'Evita duplicar la fila de aceptacion de una misma nota clinica para la misma version de politica (doble envio). No limita cuantas notas distintas -cada una con su propia aceptacion- puede crear un psicologo';

--
-- Name: Policy_Acceptance_own_version_uq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Policy_Acceptance_own_version_uq" ON public.policy_acceptance USING btree (per_id, pd_id) WHERE ((dep_id IS NULL) AND (cn_id IS NULL) AND (app_id IS NULL));

--
-- Name: INDEX "Policy_Acceptance_own_version_uq"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public."Policy_Acceptance_own_version_uq" IS 'Impide que una persona sin solicitud de cita asociada -en la practica, el psicologo aceptando los permisos de trazabilidad y uso de su agenda- acepte mas de una vez la misma version de una politica';

--
-- Name: Policy_Acceptance_person_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Policy_Acceptance_person_idx" ON public.policy_acceptance USING btree (per_id, pd_id);

--
-- Name: INDEX "Policy_Acceptance_person_idx"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public."Policy_Acceptance_person_idx" IS 'Optimiza la consulta del estado de aceptacion vigente por persona y documento de politica';

--
-- Name: Policy_Acceptance_request_version_uq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Policy_Acceptance_request_version_uq" ON public.policy_acceptance USING btree (app_id, pd_id) WHERE (app_id IS NOT NULL);

--
-- Name: INDEX "Policy_Acceptance_request_version_uq"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public."Policy_Acceptance_request_version_uq" IS 'Impide registrar dos veces la aceptacion de la misma version de politica para una misma solicitud de cita (por ejemplo, por doble envio del formulario)';

--
-- Name: Policy_Documents_type_effective_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Policy_Documents_type_effective_idx" ON public.policy_documents USING btree (pd_type, pd_effective_from DESC);

--
-- Name: INDEX "Policy_Documents_type_effective_idx"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public."Policy_Documents_type_effective_idx" IS 'Optimiza la consulta de la version vigente (mas reciente) por tipo de politica';

--
-- Name: Schedule_Occupancy_app_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Schedule_Occupancy_app_idx" ON public.schedule_occupancy USING btree (app_id);

--
-- Name: INDEX "Schedule_Occupancy_app_idx"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public."Schedule_Occupancy_app_idx" IS 'Optimiza la consulta del bloqueo de ocupacion asociado a una cita';

--
-- Name: Schedule_Occupancy_psychologist_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Schedule_Occupancy_psychologist_date_idx" ON public.schedule_occupancy USING btree (psy_id, occ_date, occ_start_time);

--
-- Name: INDEX "Schedule_Occupancy_psychologist_date_idx"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public."Schedule_Occupancy_psychologist_date_idx" IS 'Optimiza la validacion de disponibilidad por psicologo y fecha';

--
-- Name: Schedule_Recurring_Block_Psychologist_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Schedule_Recurring_Block_Psychologist_idx" ON public.schedule_recurring_blocks USING btree (psy_id, srb_day_of_week, srb_active);

--
-- Name: Security_Access_Log_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Security_Access_Log_created_idx" ON public.security_access_log USING btree (security_access_log_created_at);

--
-- Name: Security_Access_Log_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Security_Access_Log_user_idx" ON public.security_access_log USING btree (use_id);

--
-- Name: appointment_care_package_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX appointment_care_package_idx ON public.appointments USING btree (cp_id);

--
-- Name: care_package_active_dependent_uq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX care_package_active_dependent_uq ON public.care_packages USING btree (cp_patient_dependent_id) WHERE ((cp_state)::text = 'activo'::text);

--
-- Name: care_package_active_person_uq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX care_package_active_person_uq ON public.care_packages USING btree (cp_patient_person_id) WHERE ((cp_state)::text = 'activo'::text);

--
-- Name: care_package_assessment_app_uq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX care_package_assessment_app_uq ON public.care_packages USING btree (cp_assessment_app_id);

--
-- Name: idx_donation_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_donation_created_at ON public.donation USING btree (don_created_at DESC);

--
-- Name: idx_donation_wompi_txn; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_donation_wompi_txn ON public.donation USING btree (don_wompi_transaction_id);

--
--
-- Name: donation trg_donation_update_donor_total; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_donation_update_donor_total
AFTER INSERT OR DELETE OR UPDATE OF don_amount_in_cents, don_status, don_donor_id
ON public.donation
FOR EACH ROW EXECUTE FUNCTION public.fn_update_donor_total_amount();

-- Name: appointment_assignment_history Appointment_Assignment_History_Appointment_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointment_assignment_history
    ADD CONSTRAINT "Appointment_Assignment_History_Appointment_fk" FOREIGN KEY (app_id) REFERENCES public.appointments(app_id);

--
-- Name: appointment_assignment_history Appointment_Assignment_History_New_Psychologist_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointment_assignment_history
    ADD CONSTRAINT "Appointment_Assignment_History_New_Psychologist_fk" FOREIGN KEY (new_psy_id) REFERENCES public.psychologist(psy_id);

--
-- Name: appointment_assignment_history Appointment_Assignment_History_Old_Psychologist_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointment_assignment_history
    ADD CONSTRAINT "Appointment_Assignment_History_Old_Psychologist_fk" FOREIGN KEY (old_psy_id) REFERENCES public.psychologist(psy_id) ON DELETE SET NULL;

--
-- Name: appointment_assignment_history Appointment_Assignment_History_Secretary_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointment_assignment_history
    ADD CONSTRAINT "Appointment_Assignment_History_Secretary_fk" FOREIGN KEY (sec_id) REFERENCES public.users(use_id);

--
-- Name: appointments Appointment_Dependent_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT "Appointment_Dependent_fk" FOREIGN KEY (app_patient_dependent_id) REFERENCES public.dependents(dep_id);

--
-- Name: CONSTRAINT "Appointment_Dependent_fk" ON appointments; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT "Appointment_Dependent_fk" ON public.appointments IS 'Identificador proveniente de dependiente, implica que la cita solicitada por el consultante es para este menor de edad';

--
-- Name: appointments Appointment_Pacient_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT "Appointment_Pacient_fk" FOREIGN KEY (app_patient_person_id) REFERENCES public.person(per_id);

--
-- Name: CONSTRAINT "Appointment_Pacient_fk" ON appointments; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT "Appointment_Pacient_fk" ON public.appointments IS 'Identificador proveniente de persona (consultante), implica que la cita es para el mismo consultante';

--
-- Name: appointments Appointment_Psychologist_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT "Appointment_Psychologist_fk" FOREIGN KEY (psy_id) REFERENCES public.psychologist(psy_id);

--
-- Name: CONSTRAINT "Appointment_Psychologist_fk" ON appointments; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT "Appointment_Psychologist_fk" ON public.appointments IS 'Identificador proveniente del psicologo';

--
-- Name: appointments Appointment_Requester_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT "Appointment_Requester_fk" FOREIGN KEY (req_id) REFERENCES public.person(per_id);

--
-- Name: CONSTRAINT "Appointment_Requester_fk" ON appointments; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT "Appointment_Requester_fk" ON public.appointments IS 'Identificador proveniente de persona (consultante)';

--
-- Name: appointments Appointment_Secretary_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT "Appointment_Secretary_fk" FOREIGN KEY (sec_id) REFERENCES public.users(use_id);

--
-- Name: CONSTRAINT "Appointment_Secretary_fk" ON appointments; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT "Appointment_Secretary_fk" ON public.appointments IS 'Identificador proveniente de usuario (secretario)';

--
-- Name: banners Banners_Created_By_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.banners
    ADD CONSTRAINT "Banners_Created_By_fk" FOREIGN KEY (ban_created_by) REFERENCES public.users(use_id);

--
-- Name: banners Banners_Updated_By_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.banners
    ADD CONSTRAINT "Banners_Updated_By_fk" FOREIGN KEY (ban_updated_by) REFERENCES public.users(use_id);

--
-- Name: clinical_notes Clinical_Notes_Appointment_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinical_notes
    ADD CONSTRAINT "Clinical_Notes_Appointment_fk" FOREIGN KEY (app_id) REFERENCES public.appointments(app_id);

--
-- Name: clinical_notes_audit Clinical_Notes_Audit_Nota_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinical_notes_audit
    ADD CONSTRAINT "Clinical_Notes_Audit_Nota_fk" FOREIGN KEY (cn_id) REFERENCES public.clinical_notes(cn_id);

--
-- Name: clinical_notes_audit Clinical_Notes_Audit_Psicologo_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinical_notes_audit
    ADD CONSTRAINT "Clinical_Notes_Audit_Psicologo_fk" FOREIGN KEY (psy_id) REFERENCES public.psychologist(psy_id);

--
-- Name: clinical_notes Clinical_Notes_Psychologist_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinical_notes
    ADD CONSTRAINT "Clinical_Notes_Psychologist_fk" FOREIGN KEY (psy_id) REFERENCES public.psychologist(psy_id);

--
-- Name: content_cards Content_Cards_User_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_cards
    ADD CONSTRAINT "Content_Cards_User_fk" FOREIGN KEY (cc_updated_by) REFERENCES public.users(use_id);

--
-- Name: content_change_log Content_Change_Log_User_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_change_log
    ADD CONSTRAINT "Content_Change_Log_User_fk" FOREIGN KEY (use_id) REFERENCES public.users(use_id);

--
-- Name: content_items Content_Items_User_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_items
    ADD CONSTRAINT "Content_Items_User_fk" FOREIGN KEY (mar_id) REFERENCES public.users(use_id);

--
--
-- Name: donation Donation_Donor_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.donation
    ADD CONSTRAINT "Donation_Donor_fk" FOREIGN KEY (don_donor_id) REFERENCES public.donors(dono_id);

--
-- Name: CONSTRAINT "Donation_Donor_fk" ON donation; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT "Donation_Donor_fk" ON public.donation IS 'Identificador proveniente del donante.';

--
-- Name: donation Donation_PMethod_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.donation
    ADD CONSTRAINT "Donation_PMethod_fk" FOREIGN KEY (don_payment_method_id) REFERENCES public.payment_method(pmet_id);

--
-- Name: CONSTRAINT "Donation_PMethod_fk" ON donation; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT "Donation_PMethod_fk" ON public.donation IS 'Identificador que proviene del metodo de pago.';

-- Name: donation Donation_Terms_Document_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.donation
    ADD CONSTRAINT "Donation_Terms_Document_fk" FOREIGN KEY (don_terms_pd_id) REFERENCES public.policy_documents(pd_id);

--
-- Name: CONSTRAINT "Donation_Terms_Document_fk" ON donation; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT "Donation_Terms_Document_fk" ON public.donation IS 'Identificador proveniente del documento de politica aceptado en la donacion';

--
-- Name: gallery_images Gallery_Images_Created_By_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gallery_images
    ADD CONSTRAINT "Gallery_Images_Created_By_fk" FOREIGN KEY (gi_created_by) REFERENCES public.users(use_id);

--
-- Name: gallery_images Gallery_Images_Updated_By_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gallery_images
    ADD CONSTRAINT "Gallery_Images_Updated_By_fk" FOREIGN KEY (gi_updated_by) REFERENCES public.users(use_id);

--
-- Name: news News_Created_By_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news
    ADD CONSTRAINT "News_Created_By_fk" FOREIGN KEY (nw_created_by) REFERENCES public.users(use_id);

--
-- Name: news News_Updated_By_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news
    ADD CONSTRAINT "News_Updated_By_fk" FOREIGN KEY (nw_updated_by) REFERENCES public.users(use_id);

--
-- Name: person_rol PR_Person_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.person_rol
    ADD CONSTRAINT "PR_Person_fk" FOREIGN KEY (per_id) REFERENCES public.person(per_id);

--
-- Name: CONSTRAINT "PR_Person_fk" ON person_rol; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT "PR_Person_fk" ON public.person_rol IS 'Identificador proveniente de persona';

--
-- Name: person_rol PR_Rol_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.person_rol
    ADD CONSTRAINT "PR_Rol_fk" FOREIGN KEY (rol_id) REFERENCES public.rol(rol_id);

--
-- Name: CONSTRAINT "PR_Rol_fk" ON person_rol; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT "PR_Rol_fk" ON public.person_rol IS 'Identificador proveniente de rol';

--
-- Name: policy_acceptance Policy_Acceptance_Appointment_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.policy_acceptance
    ADD CONSTRAINT "Policy_Acceptance_Appointment_fk" FOREIGN KEY (app_id) REFERENCES public.appointments(app_id);

--
-- Name: CONSTRAINT "Policy_Acceptance_Appointment_fk" ON policy_acceptance; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT "Policy_Acceptance_Appointment_fk" ON public.policy_acceptance IS 'Identificador proveniente de la cita/solicitud que origino la aceptacion, cuando aplica';

--
-- Name: policy_acceptance Policy_Acceptance_Clinical_Note_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.policy_acceptance
    ADD CONSTRAINT "Policy_Acceptance_Clinical_Note_fk" FOREIGN KEY (cn_id) REFERENCES public.clinical_notes(cn_id);

--
-- Name: CONSTRAINT "Policy_Acceptance_Clinical_Note_fk" ON policy_acceptance; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT "Policy_Acceptance_Clinical_Note_fk" ON public.policy_acceptance IS 'Identificador proveniente de nota clinica, si aplica';

--
-- Name: policy_acceptance Policy_Acceptance_Dependent_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.policy_acceptance
    ADD CONSTRAINT "Policy_Acceptance_Dependent_fk" FOREIGN KEY (dep_id) REFERENCES public.dependents(dep_id);

--
-- Name: CONSTRAINT "Policy_Acceptance_Dependent_fk" ON policy_acceptance; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT "Policy_Acceptance_Dependent_fk" ON public.policy_acceptance IS 'Identificador proveniente de dependiente, si aplica';

--
-- Name: policy_acceptance Policy_Acceptance_Document_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.policy_acceptance
    ADD CONSTRAINT "Policy_Acceptance_Document_fk" FOREIGN KEY (pd_id) REFERENCES public.policy_documents(pd_id);

--
-- Name: CONSTRAINT "Policy_Acceptance_Document_fk" ON policy_acceptance; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT "Policy_Acceptance_Document_fk" ON public.policy_acceptance IS 'Identificador proveniente del documento de politica aceptado';

--
-- Name: policy_acceptance Policy_Acceptance_Person_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.policy_acceptance
    ADD CONSTRAINT "Policy_Acceptance_Person_fk" FOREIGN KEY (per_id) REFERENCES public.person(per_id);

--
-- Name: CONSTRAINT "Policy_Acceptance_Person_fk" ON policy_acceptance; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT "Policy_Acceptance_Person_fk" ON public.policy_acceptance IS 'Identificador proveniente de persona (quien acepta)';

--
-- Name: policy_acceptance Policy_Acceptance_Registered_By_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.policy_acceptance
    ADD CONSTRAINT "Policy_Acceptance_Registered_By_fk" FOREIGN KEY (pa_registered_by) REFERENCES public.users(use_id);

--
-- Name: CONSTRAINT "Policy_Acceptance_Registered_By_fk" ON policy_acceptance; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT "Policy_Acceptance_Registered_By_fk" ON public.policy_acceptance IS 'Identificador proveniente del usuario del personal que registro la aceptacion';

--
-- Name: psychologist Psychologist_User_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.psychologist
    ADD CONSTRAINT "Psychologist_User_fk" FOREIGN KEY (psy_id) REFERENCES public.person(per_id);

--
-- Name: CONSTRAINT "Psychologist_User_fk" ON psychologist; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT "Psychologist_User_fk" ON public.psychologist IS 'Identificador proveniente de persona (un psicologo puede existir antes de tener cuenta de usuario)';

--
-- Name: requester_dependent RD_Dependent_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.requester_dependent
    ADD CONSTRAINT "RD_Dependent_fk" FOREIGN KEY (dep_id) REFERENCES public.dependents(dep_id);

--
-- Name: CONSTRAINT "RD_Dependent_fk" ON requester_dependent; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT "RD_Dependent_fk" ON public.requester_dependent IS 'Identificador proveniente de dependiente';

--
-- Name: requester_dependent RD_Relationship_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.requester_dependent
    ADD CONSTRAINT "RD_Relationship_fk" FOREIGN KEY (rel_id) REFERENCES public.relationship(rel_id);

--
-- Name: CONSTRAINT "RD_Relationship_fk" ON requester_dependent; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT "RD_Relationship_fk" ON public.requester_dependent IS 'Identificador proveniente de relacion (parentesco)';

--
-- Name: requester_dependent RD_Requester_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.requester_dependent
    ADD CONSTRAINT "RD_Requester_fk" FOREIGN KEY (req_id) REFERENCES public.person(per_id);

--
-- Name: CONSTRAINT "RD_Requester_fk" ON requester_dependent; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT "RD_Requester_fk" ON public.requester_dependent IS 'Identificador proveniente de persona (consultante)';

--
-- Name: schedule_occupancy ScheduleOccupancy_Appointment_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_occupancy
    ADD CONSTRAINT "ScheduleOccupancy_Appointment_fk" FOREIGN KEY (app_id) REFERENCES public.appointments(app_id);

--
-- Name: CONSTRAINT "ScheduleOccupancy_Appointment_fk" ON schedule_occupancy; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT "ScheduleOccupancy_Appointment_fk" ON public.schedule_occupancy IS 'Identificador proveniente de la cita que genero la ocupacion';

--
-- Name: schedule_occupancy ScheduleOccupancy_Psychologist_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_occupancy
    ADD CONSTRAINT "ScheduleOccupancy_Psychologist_fk" FOREIGN KEY (psy_id) REFERENCES public.psychologist(psy_id);

--
-- Name: CONSTRAINT "ScheduleOccupancy_Psychologist_fk" ON schedule_occupancy; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT "ScheduleOccupancy_Psychologist_fk" ON public.schedule_occupancy IS 'Identificador proveniente del psicologo propietario del bloqueo';

--
-- Name: schedule Schedule_Psychologist_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule
    ADD CONSTRAINT "Schedule_Psychologist_fk" FOREIGN KEY (psy_id) REFERENCES public.psychologist(psy_id);

--
-- Name: CONSTRAINT "Schedule_Psychologist_fk" ON schedule; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT "Schedule_Psychologist_fk" ON public.schedule IS 'Identificador proveniente de psicologo';

--
-- Name: schedule_recurring_blocks Schedule_Recurring_Block_Psychologist_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_recurring_blocks
    ADD CONSTRAINT "Schedule_Recurring_Block_Psychologist_fk" FOREIGN KEY (psy_id) REFERENCES public.psychologist(psy_id);

--
-- Name: security_access_log Security_Access_Log_User_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.security_access_log
    ADD CONSTRAINT "Security_Access_Log_User_fk" FOREIGN KEY (use_id) REFERENCES public.users(use_id);

--
-- Name: CONSTRAINT "Security_Access_Log_User_fk" ON security_access_log; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT "Security_Access_Log_User_fk" ON public.security_access_log IS 'Identificador proveniente de usuario, indica quien intento el acceso no autorizado';

--
-- Name: users User_Person_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "User_Person_fk" FOREIGN KEY (use_id) REFERENCES public.person(per_id);

--
-- Name: CONSTRAINT "User_Person_fk" ON users; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON CONSTRAINT "User_Person_fk" ON public.users IS 'Identificador proveniente de persona';

--
-- Name: appointments appointments_cp_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_cp_id_fkey FOREIGN KEY (cp_id) REFERENCES public.care_packages(cp_id);

--
-- Name: care_packages care_packages_cp_assessment_app_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.care_packages
    ADD CONSTRAINT care_packages_cp_assessment_app_id_fkey FOREIGN KEY (cp_assessment_app_id) REFERENCES public.appointments(app_id);

--
-- Name: care_packages care_packages_cp_closed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.care_packages
    ADD CONSTRAINT care_packages_cp_closed_by_fkey FOREIGN KEY (cp_closed_by) REFERENCES public.person(per_id);

--
-- Name: care_packages care_packages_cp_patient_dependent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.care_packages
    ADD CONSTRAINT care_packages_cp_patient_dependent_id_fkey FOREIGN KEY (cp_patient_dependent_id) REFERENCES public.dependents(dep_id);

--
-- Name: care_packages care_packages_cp_patient_person_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.care_packages
    ADD CONSTRAINT care_packages_cp_patient_person_id_fkey FOREIGN KEY (cp_patient_person_id) REFERENCES public.person(per_id);

--
-- Name: care_packages care_packages_psy_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.care_packages
    ADD CONSTRAINT care_packages_psy_id_fkey FOREIGN KEY (psy_id) REFERENCES public.psychologist(psy_id);

--
-- Name: care_packages care_packages_sec_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.care_packages
    ADD CONSTRAINT care_packages_sec_id_fkey FOREIGN KEY (sec_id) REFERENCES public.person(per_id);

--
-- Name: person person_per_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.person
    ADD CONSTRAINT person_per_created_by_fkey FOREIGN KEY (per_created_by) REFERENCES public.users(use_id);

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
