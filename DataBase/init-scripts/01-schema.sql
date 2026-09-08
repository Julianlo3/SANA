-- ** Database generated with pgModeler (PostgreSQL Database Modeler).
-- ** pgModeler version: 1.2.3
-- ** PostgreSQL version: 18.0
-- ** Project Site: pgmodeler.io
-- ** Model Author: ---

-- ** Database creation must be performed outside a multi lined SQL file. 
-- ** These commands were put in this file only as a convenience.
-- ddl-end --


SET search_path TO pg_catalog,public;
-- ddl-end --

-- object: public."Person" | type: TABLE --
-- DROP TABLE IF EXISTS public."Person" CASCADE;
CREATE TABLE public."Person" (
	per_id integer NOT NULL,
	per_name varchar(100) NOT NULL,
	per_identity_document integer NOT NULL,
	per_email varchar(100) NOT NULL,
	per_contact_number integer NOT NULL,
	per_state varchar(15),
	per_update_date timestamptz,
	CONSTRAINT "Person_pk" PRIMARY KEY (per_id),
	CONSTRAINT "Person_IDocument_uq" UNIQUE (per_identity_document)
);
-- ddl-end --
COMMENT ON TABLE public."Person" IS E'Representa a la persona corriente';
-- ddl-end --
COMMENT ON COLUMN public."Person".per_id IS E'Index, identificador de persona';
-- ddl-end --
COMMENT ON COLUMN public."Person".per_name IS E'Nombre de la persona';
-- ddl-end --
COMMENT ON COLUMN public."Person".per_identity_document IS E'Numero del documento de ciudadania';
-- ddl-end --
COMMENT ON COLUMN public."Person".per_email IS E'Correo electronico de la persona';
-- ddl-end --
COMMENT ON COLUMN public."Person".per_contact_number IS E'Numero de telefono mobil';
-- ddl-end --
COMMENT ON COLUMN public."Person".per_state IS E'Estado actual de la cuenta';
-- ddl-end --
COMMENT ON COLUMN public."Person".per_update_date IS E'Fecha y hora en la cual se concreto una actualizacion de los datos de una persona';
-- ddl-end --
ALTER TABLE public."Person" OWNER TO postgres;
-- ddl-end --

-- object: public."User" | type: TABLE --
-- DROP TABLE IF EXISTS public."User" CASCADE;
CREATE TABLE public."User" (
	use_id integer NOT NULL,
	user_provider_id integer NOT NULL,
	user_provider_name varchar(25) NOT NULL,
	CONSTRAINT "User_pk" PRIMARY KEY (use_id)
);
-- ddl-end --
COMMENT ON TABLE public."User" IS E'Representa a la persona con cuenta dentro del sistema';
-- ddl-end --
COMMENT ON COLUMN public."User".use_id IS E'Index identificador del usuario';
-- ddl-end --
COMMENT ON COLUMN public."User".user_provider_id IS E'El identificador que fue dado/asignado por OAuth';
-- ddl-end --
COMMENT ON COLUMN public."User".user_provider_name IS E'El nombre del proovedor con el cual se hizo el inicio de sesion';
-- ddl-end --
ALTER TABLE public."User" OWNER TO postgres;
-- ddl-end --

-- object: public."Psychologist" | type: TABLE --
-- DROP TABLE IF EXISTS public."Psychologist" CASCADE;
CREATE TABLE public."Psychologist" (
	psy_id integer NOT NULL,
	psy_license_number integer NOT NULL,
	psy_speciality varchar(45) NOT NULL,
	CONSTRAINT "Psychologist_pk" PRIMARY KEY (psy_id)
);
-- ddl-end --
COMMENT ON TABLE public."Psychologist" IS E'Representa al usuario el cual tiene como rol psicologo';
-- ddl-end --
COMMENT ON COLUMN public."Psychologist".psy_id IS E'Index, identificador del psicologo';
-- ddl-end --
COMMENT ON COLUMN public."Psychologist".psy_license_number IS E'El numero de licencia medico profesional para psicologos';
-- ddl-end --
COMMENT ON COLUMN public."Psychologist".psy_speciality IS E'Especialidad profesional del psicologo';
-- ddl-end --
ALTER TABLE public."Psychologist" OWNER TO postgres;
-- ddl-end --

-- object: public."Schedule" | type: TABLE --
-- DROP TABLE IF EXISTS public."Schedule" CASCADE;
CREATE TABLE public."Schedule" (
	sch_id integer NOT NULL,
	psy_id integer NOT NULL,
	app_id integer,
	sch_date date NOT NULL,
	sch_start_time time NOT NULL,
	sch_end_time time NOT NULL,
	CONSTRAINT "Schedule_pk" PRIMARY KEY (sch_id)
);
-- ddl-end --
COMMENT ON TABLE public."Schedule" IS E'Representa las franjas horarias por la cual el psicologo esta ocupado';
-- ddl-end --
COMMENT ON COLUMN public."Schedule".sch_id IS E'Index, identificador de la agenda o franja horaria';
-- ddl-end --
COMMENT ON COLUMN public."Schedule".psy_id IS E'Identificador del psicologo';
-- ddl-end --
COMMENT ON COLUMN public."Schedule".app_id IS E'Identificador de la cita, en caso de que la razon de ocupacion sea por una';
-- ddl-end --
COMMENT ON COLUMN public."Schedule".sch_date IS E'Fecha en la que el psicologo indica su indospinibilidad';
-- ddl-end --
COMMENT ON COLUMN public."Schedule".sch_start_time IS E'Hora inicial en la que el psicologo indica su indospinibilidad';
-- ddl-end --
COMMENT ON COLUMN public."Schedule".sch_end_time IS E'Hora final en la que el psicologo indica su indospinibilidad';
-- ddl-end --
ALTER TABLE public."Schedule" OWNER TO postgres;
-- ddl-end --

-- object: public."Appointments" | type: TABLE --
-- DROP TABLE IF EXISTS public."Appointments" CASCADE;
CREATE TABLE public."Appointments" (
	app_id integer NOT NULL,
	psy_id integer NOT NULL,
	sec_id integer NOT NULL,
	req_id integer NOT NULL,
	app_patient_person_id integer,
	"app_patient dependent_id" integer,
	app_date timestamptz NOT NULL,
	app_state varchar(15) NOT NULL,
	app_type varchar(15) NOT NULL,
	CONSTRAINT "Appointments_pk" PRIMARY KEY (app_id)
);
-- ddl-end --
COMMENT ON TABLE public."Appointments" IS E'Representa la planeacion para el planteamiento de la cita psicologica';
-- ddl-end --
COMMENT ON COLUMN public."Appointments".app_id IS E'Index, identificador de la cita';
-- ddl-end --
COMMENT ON COLUMN public."Appointments".psy_id IS E'Identificador del psicologo';
-- ddl-end --
COMMENT ON COLUMN public."Appointments".sec_id IS E'Identificador del secretario';
-- ddl-end --
COMMENT ON COLUMN public."Appointments".req_id IS E'Identificador del consultante';
-- ddl-end --
COMMENT ON COLUMN public."Appointments".app_patient_person_id IS E'Identificador del paciente si este es para el propio consultante';
-- ddl-end --
COMMENT ON COLUMN public."Appointments"."app_patient dependent_id" IS E'Identificador del paciente si este es para un dependiente (menor de edad) registrado por el consultante';
-- ddl-end --
COMMENT ON COLUMN public."Appointments".app_date IS E'Fecha de cuando inicia la cita';
-- ddl-end --
COMMENT ON COLUMN public."Appointments".app_state IS E'Estado actual de la cita';
-- ddl-end --
COMMENT ON COLUMN public."Appointments".app_type IS E'Tipo de la cita';
-- ddl-end --
ALTER TABLE public."Appointments" OWNER TO postgres;
-- ddl-end --

-- object: public."Rol" | type: TABLE --
-- DROP TABLE IF EXISTS public."Rol" CASCADE;
CREATE TABLE public."Rol" (
	rol_id integer NOT NULL,
	rol_description varchar(25) NOT NULL,
	CONSTRAINT "Rol_pk" PRIMARY KEY (rol_id)
);
-- ddl-end --
COMMENT ON TABLE public."Rol" IS E'Clasificaccion de la persona la cual le brinda ciertos privilegios y responsabilidades';
-- ddl-end --
COMMENT ON COLUMN public."Rol".rol_id IS E'Index, identificador de rol';
-- ddl-end --
COMMENT ON COLUMN public."Rol".rol_description IS E'Descripcion o nombre del rol';
-- ddl-end --
ALTER TABLE public."Rol" OWNER TO postgres;
-- ddl-end --

-- object: public."Person_Rol" | type: TABLE --
-- DROP TABLE IF EXISTS public."Person_Rol" CASCADE;
CREATE TABLE public."Person_Rol" (
	per_id integer NOT NULL,
	rol_id integer NOT NULL,
	pr_assigned_at timestamptz NOT NULL,
	CONSTRAINT "Person_Roles_pk" PRIMARY KEY (per_id,rol_id)
);
-- ddl-end --
COMMENT ON TABLE public."Person_Rol" IS E'Tabla intermedia que vincula las personas con su/sus rol/roles';
-- ddl-end --
COMMENT ON COLUMN public."Person_Rol".per_id IS E'Identificador de la persona';
-- ddl-end --
COMMENT ON COLUMN public."Person_Rol".rol_id IS E'Identificador del rol';
-- ddl-end --
COMMENT ON COLUMN public."Person_Rol".pr_assigned_at IS E'Fecha y hora de la asignacion de un rol a una persona';
-- ddl-end --
ALTER TABLE public."Person_Rol" OWNER TO postgres;
-- ddl-end --

-- object: public."Dependents" | type: TABLE --
-- DROP TABLE IF EXISTS public."Dependents" CASCADE;
CREATE TABLE public."Dependents" (
	dep_id integer NOT NULL,
	dep_identity_document integer NOT NULL,
	dep_name varchar(100) NOT NULL,
	dep_contact_number integer NOT NULL,
	dep_birthdate date NOT NULL,
	CONSTRAINT "Dependents_pk" PRIMARY KEY (dep_id),
	CONSTRAINT "Dependent_IDocument_uq" UNIQUE (dep_identity_document)
);
-- ddl-end --
COMMENT ON TABLE public."Dependents" IS E'Personas las cuales se categorizan como menores de edad, y por ello son dependientes de su tutor legal para interactuar con el sistema';
-- ddl-end --
COMMENT ON COLUMN public."Dependents".dep_id IS E'Index, identificador de dependiente (menor de edad)';
-- ddl-end --
COMMENT ON COLUMN public."Dependents".dep_identity_document IS E'Numero del documento de ciudadania';
-- ddl-end --
COMMENT ON COLUMN public."Dependents".dep_name IS E'Nombre del dependiente';
-- ddl-end --
COMMENT ON COLUMN public."Dependents".dep_contact_number IS E'Numero de telefono mobil del dependiente';
-- ddl-end --
COMMENT ON COLUMN public."Dependents".dep_birthdate IS E'Fecha de nacimiento del dependiente';
-- ddl-end --
ALTER TABLE public."Dependents" OWNER TO postgres;
-- ddl-end --

-- object: public."Relationship" | type: TABLE --
-- DROP TABLE IF EXISTS public."Relationship" CASCADE;
CREATE TABLE public."Relationship" (
	rel_id integer NOT NULL,
	rel_description varchar(25) NOT NULL,
	CONSTRAINT "Relationship_pk" PRIMARY KEY (rel_id)
);
-- ddl-end --
COMMENT ON TABLE public."Relationship" IS E'Tipos de relacion que tiene un menor de edad con su tutor legal';
-- ddl-end --
COMMENT ON COLUMN public."Relationship".rel_id IS E'Index, identificador de relacion/parentesco';
-- ddl-end --
COMMENT ON COLUMN public."Relationship".rel_description IS E'Descripcion o nombre del parentesco del consultante hacia el menor';
-- ddl-end --
ALTER TABLE public."Relationship" OWNER TO postgres;
-- ddl-end --

-- object: public."Donors" | type: TABLE --
-- DROP TABLE IF EXISTS public."Donors" CASCADE;
CREATE TABLE public."Donors" (
	dono_id integer NOT NULL,
	dono_total_amount numeric(100,0),
	dono_email varchar(100) NOT NULL,
	dono_last_donation_date date,
	CONSTRAINT "Donors_pk" PRIMARY KEY (dono_id)
);
-- ddl-end --
COMMENT ON TABLE public."Donors" IS E'Representa a la persona corriente la cual desea realizar una donacion';
-- ddl-end --
COMMENT ON COLUMN public."Donors".dono_id IS E'Index, identificador del donador';
-- ddl-end --
ALTER TABLE public."Donors" OWNER TO postgres;
-- ddl-end --

-- object: public."Donations" | type: TABLE --
-- DROP TABLE IF EXISTS public."Donations" CASCADE;
CREATE TABLE public."Donations" (
	dona_id integer NOT NULL,
	dono_id integer NOT NULL,
	pmet_id integer NOT NULL,
	dona_amount numeric(100,0) NOT NULL,
	dona_state varchar(10) NOT NULL,
	dona_description varchar(250),
	CONSTRAINT "Donations_pk" PRIMARY KEY (dona_id)
);
-- ddl-end --
COMMENT ON TABLE public."Donations" IS E'Representa la donacion realizada por los donantes';
-- ddl-end --
COMMENT ON COLUMN public."Donations".dona_id IS E'Index, identificador de la donacion';
-- ddl-end --
COMMENT ON COLUMN public."Donations".dono_id IS E'Identificador del donante';
-- ddl-end --
COMMENT ON COLUMN public."Donations".pmet_id IS E'Identificador del metodo de pago';
-- ddl-end --
COMMENT ON COLUMN public."Donations".dona_amount IS E'Cantidad donada';
-- ddl-end --
COMMENT ON COLUMN public."Donations".dona_state IS E'Estado de la donacion dado por parte de la API';
-- ddl-end --
COMMENT ON COLUMN public."Donations".dona_description IS E'Mensaje que puede ser dado por el donante';
-- ddl-end --
ALTER TABLE public."Donations" OWNER TO postgres;
-- ddl-end --

-- object: public.payment_method | type: TABLE --
-- DROP TABLE IF EXISTS public.payment_method CASCADE;
CREATE TABLE public.payment_method (
	pmet_id integer NOT NULL,
	pmet_is_active boolean NOT NULL DEFAULT true,
	pmet_name varchar(25) NOT NULL,
	CONSTRAINT payment_method_pk PRIMARY KEY (pmet_id)
);
-- ddl-end --
COMMENT ON TABLE public.payment_method IS E'Representa al metodo de pago con el cual se puede realizar una donacion';
-- ddl-end --
COMMENT ON COLUMN public.payment_method.pmet_id IS E'Index, identificador del metodo de pago';
-- ddl-end --
COMMENT ON COLUMN public.payment_method.pmet_is_active IS E'Estado en el cual se indica si un metodo de pago puede ser usado';
-- ddl-end --
COMMENT ON COLUMN public.payment_method.pmet_name IS E'Nombre del servicio usado';
-- ddl-end --
ALTER TABLE public.payment_method OWNER TO postgres;
-- ddl-end --

-- object: public."Requester_Dependent" | type: TABLE --
-- DROP TABLE IF EXISTS public."Requester_Dependent" CASCADE;
CREATE TABLE public."Requester_Dependent" (
	req_id integer NOT NULL,
	dep_id integer NOT NULL,
	rel_id integer NOT NULL,
	rd_assigned_at timestamptz NOT NULL,
	CONSTRAINT "Requester_Dependent_pk" PRIMARY KEY (req_id,dep_id,rel_id)
);
-- ddl-end --
COMMENT ON TABLE public."Requester_Dependent" IS E'Tabla intermedia, vincula los consultantes con los menores de edad segun su parentesco';
-- ddl-end --
COMMENT ON COLUMN public."Requester_Dependent".req_id IS E'Identificador del consultante';
-- ddl-end --
COMMENT ON COLUMN public."Requester_Dependent".dep_id IS E'Identificador del dependiente (menor de edad)';
-- ddl-end --
COMMENT ON COLUMN public."Requester_Dependent".rel_id IS E'Identificador de la relacion (parentesco)';
-- ddl-end --
COMMENT ON COLUMN public."Requester_Dependent".rd_assigned_at IS E'Fecha y hora en la que un consultante registro a un menor de idad y definio su parentesco con este';
-- ddl-end --
ALTER TABLE public."Requester_Dependent" OWNER TO postgres;
-- ddl-end --

-- object: "User_Person_fk" | type: CONSTRAINT --
-- ALTER TABLE public."User" DROP CONSTRAINT IF EXISTS "User_Person_fk" CASCADE;
ALTER TABLE public."User" ADD CONSTRAINT "User_Person_fk" FOREIGN KEY (use_id)
REFERENCES public."Person" (per_id) MATCH SIMPLE
ON DELETE NO ACTION ON UPDATE NO ACTION;
-- ddl-end --

-- object: "Psychologist_User_fk" | type: CONSTRAINT --
-- ALTER TABLE public."Psychologist" DROP CONSTRAINT IF EXISTS "Psychologist_User_fk" CASCADE;
ALTER TABLE public."Psychologist" ADD CONSTRAINT "Psychologist_User_fk" FOREIGN KEY (psy_id)
REFERENCES public."User" (use_id) MATCH SIMPLE
ON DELETE NO ACTION ON UPDATE NO ACTION;
-- ddl-end --

-- object: "Schedule_Psychologist_fk" | type: CONSTRAINT --
-- ALTER TABLE public."Schedule" DROP CONSTRAINT IF EXISTS "Schedule_Psychologist_fk" CASCADE;
ALTER TABLE public."Schedule" ADD CONSTRAINT "Schedule_Psychologist_fk" FOREIGN KEY (psy_id)
REFERENCES public."Psychologist" (psy_id) MATCH SIMPLE
ON DELETE NO ACTION ON UPDATE NO ACTION;
-- ddl-end --

-- object: "Schedule_Appointment_fk" | type: CONSTRAINT --
-- ALTER TABLE public."Schedule" DROP CONSTRAINT IF EXISTS "Schedule_Appointment_fk" CASCADE;
ALTER TABLE public."Schedule" ADD CONSTRAINT "Schedule_Appointment_fk" FOREIGN KEY (app_id)
REFERENCES public."Appointments" (app_id) MATCH SIMPLE
ON DELETE NO ACTION ON UPDATE NO ACTION;
-- ddl-end --

-- object: "Appointment_Psychologist_fk" | type: CONSTRAINT --
-- ALTER TABLE public."Appointments" DROP CONSTRAINT IF EXISTS "Appointment_Psychologist_fk" CASCADE;
ALTER TABLE public."Appointments" ADD CONSTRAINT "Appointment_Psychologist_fk" FOREIGN KEY (psy_id)
REFERENCES public."Psychologist" (psy_id) MATCH SIMPLE
ON DELETE NO ACTION ON UPDATE NO ACTION;
-- ddl-end --

-- object: "Appointment_Secretary_fk" | type: CONSTRAINT --
-- ALTER TABLE public."Appointments" DROP CONSTRAINT IF EXISTS "Appointment_Secretary_fk" CASCADE;
ALTER TABLE public."Appointments" ADD CONSTRAINT "Appointment_Secretary_fk" FOREIGN KEY (sec_id)
REFERENCES public."User" (use_id) MATCH SIMPLE
ON DELETE NO ACTION ON UPDATE NO ACTION;
-- ddl-end --

-- object: "Appointment_Requester_fk" | type: CONSTRAINT --
-- ALTER TABLE public."Appointments" DROP CONSTRAINT IF EXISTS "Appointment_Requester_fk" CASCADE;
ALTER TABLE public."Appointments" ADD CONSTRAINT "Appointment_Requester_fk" FOREIGN KEY (req_id)
REFERENCES public."Person" (per_id) MATCH SIMPLE
ON DELETE NO ACTION ON UPDATE NO ACTION;
-- ddl-end --

-- object: "Appointment_Pacient_fk" | type: CONSTRAINT --
-- ALTER TABLE public."Appointments" DROP CONSTRAINT IF EXISTS "Appointment_Pacient_fk" CASCADE;
ALTER TABLE public."Appointments" ADD CONSTRAINT "Appointment_Pacient_fk" FOREIGN KEY (app_patient_person_id)
REFERENCES public."Person" (per_id) MATCH SIMPLE
ON DELETE NO ACTION ON UPDATE NO ACTION;
-- ddl-end --

-- object: "Appointment_Dependent_fk" | type: CONSTRAINT --
-- ALTER TABLE public."Appointments" DROP CONSTRAINT IF EXISTS "Appointment_Dependent_fk" CASCADE;
ALTER TABLE public."Appointments" ADD CONSTRAINT "Appointment_Dependent_fk" FOREIGN KEY ("app_patient dependent_id")
REFERENCES public."Dependents" (dep_id) MATCH SIMPLE
ON DELETE NO ACTION ON UPDATE NO ACTION;
-- ddl-end --

-- object: "PR_Person" | type: CONSTRAINT --
-- ALTER TABLE public."Person_Rol" DROP CONSTRAINT IF EXISTS "PR_Person" CASCADE;
ALTER TABLE public."Person_Rol" ADD CONSTRAINT "PR_Person" FOREIGN KEY (per_id)
REFERENCES public."Person" (per_id) MATCH SIMPLE
ON DELETE NO ACTION ON UPDATE NO ACTION;
-- ddl-end --

-- object: "PR_Rol" | type: CONSTRAINT --
-- ALTER TABLE public."Person_Rol" DROP CONSTRAINT IF EXISTS "PR_Rol" CASCADE;
ALTER TABLE public."Person_Rol" ADD CONSTRAINT "PR_Rol" FOREIGN KEY (rol_id)
REFERENCES public."Rol" (rol_id) MATCH SIMPLE
ON DELETE NO ACTION ON UPDATE NO ACTION;
-- ddl-end --

-- object: "Donation_Donor_fk" | type: CONSTRAINT --
-- ALTER TABLE public."Donations" DROP CONSTRAINT IF EXISTS "Donation_Donor_fk" CASCADE;
ALTER TABLE public."Donations" ADD CONSTRAINT "Donation_Donor_fk" FOREIGN KEY (dono_id)
REFERENCES public."Donors" (dono_id) MATCH SIMPLE
ON DELETE NO ACTION ON UPDATE NO ACTION;
-- ddl-end --

-- object: "Donation_PMethod_fk" | type: CONSTRAINT --
-- ALTER TABLE public."Donations" DROP CONSTRAINT IF EXISTS "Donation_PMethod_fk" CASCADE;
ALTER TABLE public."Donations" ADD CONSTRAINT "Donation_PMethod_fk" FOREIGN KEY (pmet_id)
REFERENCES public.payment_method (pmet_id) MATCH SIMPLE
ON DELETE NO ACTION ON UPDATE NO ACTION;
-- ddl-end --

-- object: "RD_Requester_fk" | type: CONSTRAINT --
-- ALTER TABLE public."Requester_Dependent" DROP CONSTRAINT IF EXISTS "RD_Requester_fk" CASCADE;
ALTER TABLE public."Requester_Dependent" ADD CONSTRAINT "RD_Requester_fk" FOREIGN KEY (req_id)
REFERENCES public."Person" (per_id) MATCH SIMPLE
ON DELETE NO ACTION ON UPDATE NO ACTION;
-- ddl-end --

-- object: "RD_Dependent" | type: CONSTRAINT --
-- ALTER TABLE public."Requester_Dependent" DROP CONSTRAINT IF EXISTS "RD_Dependent" CASCADE;
ALTER TABLE public."Requester_Dependent" ADD CONSTRAINT "RD_Dependent" FOREIGN KEY (dep_id)
REFERENCES public."Dependents" (dep_id) MATCH SIMPLE
ON DELETE NO ACTION ON UPDATE NO ACTION;
-- ddl-end --

-- object: "RD_Relationship" | type: CONSTRAINT --
-- ALTER TABLE public."Requester_Dependent" DROP CONSTRAINT IF EXISTS "RD_Relationship" CASCADE;
ALTER TABLE public."Requester_Dependent" ADD CONSTRAINT "RD_Relationship" FOREIGN KEY (rel_id)
REFERENCES public."Relationship" (rel_id) MATCH SIMPLE
ON DELETE NO ACTION ON UPDATE NO ACTION;
-- ddl-end --


