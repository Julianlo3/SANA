-- ** Database generated with pgModeler (PostgreSQL Database Modeler).
-- ** pgModeler version: 1.2.3
-- ** PostgreSQL version: 18.0
-- ** Project Site: pgmodeler.io
-- ** Model Author: ---

-- ** Database creation must be performed outside a multi lined SQL file. 
-- ** These commands were put in this file only as a convenience.

-- object: new_database | type: DATABASE --
-- DROP DATABASE IF EXISTS new_database;
-- ddl-end --


SET search_path TO pg_catalog,public;
-- ddl-end --

-- object: public.person | type: TABLE --
-- DROP TABLE IF EXISTS public.person CASCADE;
CREATE TABLE public.person (
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
COMMENT ON TABLE public.person IS E'Representa a la persona corriente';
-- ddl-end --
COMMENT ON COLUMN public.person.per_id IS E'Index, identificador de persona';
-- ddl-end --
COMMENT ON COLUMN public.person.per_name IS E'Nombre de la persona';
-- ddl-end --
COMMENT ON COLUMN public.person.per_identity_document IS E'Numero del documento de ciudadania';
-- ddl-end --
COMMENT ON COLUMN public.person.per_email IS E'Correo electronico de la persona';
-- ddl-end --
COMMENT ON COLUMN public.person.per_contact_number IS E'Numero de telefono mobil';
-- ddl-end --
COMMENT ON COLUMN public.person.per_state IS E'Estado actual de la cuenta';
-- ddl-end --
COMMENT ON COLUMN public.person.per_update_date IS E'Fecha y hora en la cual se concreto una actualizacion de los datos de una persona';
-- ddl-end --
ALTER TABLE public.person OWNER TO postgres;
-- ddl-end --

-- object: public.users | type: TABLE --
-- DROP TABLE IF EXISTS public.users CASCADE;
CREATE TABLE public.users (
	use_id integer NOT NULL,
	user_provider_id integer NOT NULL,
	user_provider_name varchar(25) NOT NULL,
	CONSTRAINT "User_pk" PRIMARY KEY (use_id)
);
-- ddl-end --
COMMENT ON TABLE public.users IS E'Representa a la persona con cuenta dentro del sistema';
-- ddl-end --
COMMENT ON COLUMN public.users.use_id IS E'Index identificador del usuario (proviende de persona)';
-- ddl-end --
COMMENT ON COLUMN public.users.user_provider_id IS E'El identificador que fue dado/asignado por OAuth';
-- ddl-end --
COMMENT ON COLUMN public.users.user_provider_name IS E'El nombre del proovedor con el cual se hizo el inicio de sesion';
-- ddl-end --
ALTER TABLE public.users OWNER TO postgres;
-- ddl-end --

-- object: public.psychologist | type: TABLE --
-- DROP TABLE IF EXISTS public.psychologist CASCADE;
CREATE TABLE public.psychologist (
	psy_id integer NOT NULL,
	psy_license_number integer NOT NULL,
	psy_speciality varchar(45) NOT NULL,
	CONSTRAINT "Psychologist_pk" PRIMARY KEY (psy_id)
);
-- ddl-end --
COMMENT ON TABLE public.psychologist IS E'Representa al usuario el cual tiene como rol psicologo';
-- ddl-end --
COMMENT ON COLUMN public.psychologist.psy_id IS E'Index, identificador del psicologo, proviene de usuario';
-- ddl-end --
COMMENT ON COLUMN public.psychologist.psy_license_number IS E'El numero de licencia medico profesional para psicologos';
-- ddl-end --
COMMENT ON COLUMN public.psychologist.psy_speciality IS E'Especialidad profesional del psicologo';
-- ddl-end --
ALTER TABLE public.psychologist OWNER TO postgres;
-- ddl-end --

-- object: public.schedule | type: TABLE --
-- DROP TABLE IF EXISTS public.schedule CASCADE;
CREATE TABLE public.schedule (
	sch_id integer NOT NULL,
	psy_id integer NOT NULL,
	app_id integer,
	sch_date date NOT NULL,
	sch_start_time time NOT NULL,
	sch_end_time time NOT NULL,
	CONSTRAINT "Schedule_pk" PRIMARY KEY (sch_id)
);
-- ddl-end --
COMMENT ON TABLE public.schedule IS E'Representa las franjas horarias por la cual el psicologo esta ocupado';
-- ddl-end --
COMMENT ON COLUMN public.schedule.sch_id IS E'Index, identificador de la agenda o franja horaria';
-- ddl-end --
COMMENT ON COLUMN public.schedule.psy_id IS E'Identificador del psicologo';
-- ddl-end --
COMMENT ON COLUMN public.schedule.app_id IS E'Identificador de la cita, en caso de que la razon de ocupacion sea por una';
-- ddl-end --
COMMENT ON COLUMN public.schedule.sch_date IS E'Fecha en la que el psicologo indica su indospinibilidad';
-- ddl-end --
COMMENT ON COLUMN public.schedule.sch_start_time IS E'Hora inicial en la que el psicologo indica su indospinibilidad';
-- ddl-end --
COMMENT ON COLUMN public.schedule.sch_end_time IS E'Hora final en la que el psicologo indica su indospinibilidad';
-- ddl-end --
ALTER TABLE public.schedule OWNER TO postgres;
-- ddl-end --

-- object: public.appointments | type: TABLE --
-- DROP TABLE IF EXISTS public.appointments CASCADE;
CREATE TABLE public.appointments (
	app_id integer NOT NULL,
	psy_id integer NOT NULL,
	sec_id integer NOT NULL,
	req_id integer NOT NULL,
	app_patient_person_id integer,
	app_patient_dependent_id integer,
	app_date timestamptz NOT NULL,
	app_state varchar(15) NOT NULL,
	app_type varchar(15) NOT NULL,
	CONSTRAINT "Appointments_pk" PRIMARY KEY (app_id)
);
-- ddl-end --
COMMENT ON TABLE public.appointments IS E'Representa la planeacion para el planteamiento de la cita psicologica';
-- ddl-end --
COMMENT ON COLUMN public.appointments.app_id IS E'Index, identificador de la cita';
-- ddl-end --
COMMENT ON COLUMN public.appointments.psy_id IS E'Identificador del psicologo';
-- ddl-end --
COMMENT ON COLUMN public.appointments.sec_id IS E'Identificador del secretario';
-- ddl-end --
COMMENT ON COLUMN public.appointments.req_id IS E'Identificador del consultante';
-- ddl-end --
COMMENT ON COLUMN public.appointments.app_patient_person_id IS E'Identificador del paciente si este es para el propio consultante';
-- ddl-end --
COMMENT ON COLUMN public.appointments.app_patient_dependent_id IS E'Identificador del paciente si este es para un dependiente (menor de edad) registrado por el consultante';
-- ddl-end --
COMMENT ON COLUMN public.appointments.app_date IS E'Fecha de cuando inicia la cita';
-- ddl-end --
COMMENT ON COLUMN public.appointments.app_state IS E'Estado actual de la cita';
-- ddl-end --
COMMENT ON COLUMN public.appointments.app_type IS E'Tipo de la cita';
-- ddl-end --
ALTER TABLE public.appointments OWNER TO postgres;
-- ddl-end --

-- object: public.rol | type: TABLE --
-- DROP TABLE IF EXISTS public.rol CASCADE;
CREATE TABLE public.rol (
	rol_id integer NOT NULL,
	rol_description varchar(25) NOT NULL,
	CONSTRAINT "Rol_pk" PRIMARY KEY (rol_id)
);
-- ddl-end --
COMMENT ON TABLE public.rol IS E'Clasificaccion de la persona la cual le brinda ciertos privilegios y responsabilidades';
-- ddl-end --
COMMENT ON COLUMN public.rol.rol_id IS E'Index, identificador de rol';
-- ddl-end --
COMMENT ON COLUMN public.rol.rol_description IS E'Descripcion o nombre del rol';
-- ddl-end --
ALTER TABLE public.rol OWNER TO postgres;
-- ddl-end --

-- object: public.person_rol | type: TABLE --
-- DROP TABLE IF EXISTS public.person_rol CASCADE;
CREATE TABLE public.person_rol (
	per_id integer NOT NULL,
	rol_id integer NOT NULL,
	pr_assigned_at timestamptz NOT NULL,
	CONSTRAINT "Person_Roles_pk" PRIMARY KEY (per_id,rol_id)
);
-- ddl-end --
COMMENT ON TABLE public.person_rol IS E'Tabla intermedia que vincula las personas con su/sus rol/roles';
-- ddl-end --
COMMENT ON COLUMN public.person_rol.per_id IS E'Identificador de la persona';
-- ddl-end --
COMMENT ON COLUMN public.person_rol.rol_id IS E'Identificador del rol';
-- ddl-end --
COMMENT ON COLUMN public.person_rol.pr_assigned_at IS E'Fecha y hora de la asignacion de un rol a una persona';
-- ddl-end --
ALTER TABLE public.person_rol OWNER TO postgres;
-- ddl-end --

-- object: public.dependents | type: TABLE --
-- DROP TABLE IF EXISTS public.dependents CASCADE;
CREATE TABLE public.dependents (
	dep_id integer NOT NULL,
	dep_identity_document integer NOT NULL,
	dep_name varchar(100) NOT NULL,
	dep_contact_number integer NOT NULL,
	dep_birthdate date NOT NULL,
	CONSTRAINT "Dependents_pk" PRIMARY KEY (dep_id),
	CONSTRAINT "Dependent_IDocument_uq" UNIQUE (dep_identity_document)
);
-- ddl-end --
COMMENT ON TABLE public.dependents IS E'Personas menores de edad, dependientes de su tutor legal. Se modelan en una tabla separada de Person (y no como subtipo) porque sus datos requieren tratamiento especial bajo la normativa de proteccion de datos de menores';
-- ddl-end --
COMMENT ON COLUMN public.dependents.dep_id IS E'Index, identificador de dependiente (menor de edad)';
-- ddl-end --
COMMENT ON COLUMN public.dependents.dep_identity_document IS E'Numero del documento de ciudadania';
-- ddl-end --
COMMENT ON COLUMN public.dependents.dep_name IS E'Nombre del dependiente';
-- ddl-end --
COMMENT ON COLUMN public.dependents.dep_contact_number IS E'Numero de telefono mobil del dependiente';
-- ddl-end --
COMMENT ON COLUMN public.dependents.dep_birthdate IS E'Fecha de nacimiento del dependiente';
-- ddl-end --
ALTER TABLE public.dependents OWNER TO postgres;
-- ddl-end --

-- object: public.relationship | type: TABLE --
-- DROP TABLE IF EXISTS public.relationship CASCADE;
CREATE TABLE public.relationship (
	rel_id integer NOT NULL,
	rel_description varchar(25) NOT NULL,
	CONSTRAINT "Relationship_pk" PRIMARY KEY (rel_id)
);
-- ddl-end --
COMMENT ON TABLE public.relationship IS E'Tipos de relacion que tiene un menor de edad con su tutor legal';
-- ddl-end --
COMMENT ON COLUMN public.relationship.rel_id IS E'Index, identificador de relacion/parentesco';
-- ddl-end --
COMMENT ON COLUMN public.relationship.rel_description IS E'Descripcion o nombre del parentesco del consultante hacia el menor';
-- ddl-end --
ALTER TABLE public.relationship OWNER TO postgres;
-- ddl-end --

-- object: public.donors | type: TABLE --
-- DROP TABLE IF EXISTS public.donors CASCADE;
CREATE TABLE public.donors (
	dono_id integer NOT NULL,
	dono_total_amount numeric(20,2),
	dono_email varchar(100) NOT NULL,
	dono_last_donation_date date,
	CONSTRAINT "Donors_pk" PRIMARY KEY (dono_id)
);
-- ddl-end --
COMMENT ON TABLE public.donors IS E'Representa a la persona corriente la cual desea realizar una donacion';
-- ddl-end --
COMMENT ON COLUMN public.donors.dono_id IS E'Index, identificador del donador';
-- ddl-end --
ALTER TABLE public.donors OWNER TO postgres;
-- ddl-end --

-- object: public.donations | type: TABLE --
-- DROP TABLE IF EXISTS public.donations CASCADE;
CREATE TABLE public.donations (
	dona_id integer NOT NULL,
	dono_id integer NOT NULL,
	pmet_id integer NOT NULL,
	dona_amount numeric(12,2) NOT NULL,
	dona_state varchar(10) NOT NULL,
	dona_description varchar(250),
	CONSTRAINT "Donations_pk" PRIMARY KEY (dona_id)
);
-- ddl-end --
COMMENT ON TABLE public.donations IS E'Representa la donacion realizada por los donantes';
-- ddl-end --
COMMENT ON COLUMN public.donations.dona_id IS E'Index, identificador de la donacion';
-- ddl-end --
COMMENT ON COLUMN public.donations.dono_id IS E'Identificador del donante';
-- ddl-end --
COMMENT ON COLUMN public.donations.pmet_id IS E'Identificador del metodo de pago';
-- ddl-end --
COMMENT ON COLUMN public.donations.dona_amount IS E'Cantidad donada';
-- ddl-end --
COMMENT ON COLUMN public.donations.dona_state IS E'Estado de la donacion dado por parte de la API';
-- ddl-end --
COMMENT ON COLUMN public.donations.dona_description IS E'Mensaje que puede ser dado por el donante';
-- ddl-end --
ALTER TABLE public.donations OWNER TO postgres;
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

-- object: public.requester_dependent | type: TABLE --
-- DROP TABLE IF EXISTS public.requester_dependent CASCADE;
CREATE TABLE public.requester_dependent (
	req_id integer NOT NULL,
	dep_id integer NOT NULL,
	rel_id integer NOT NULL,
	rd_assigned_at timestamptz NOT NULL,
	CONSTRAINT "Requester_Dependent_pk" PRIMARY KEY (req_id,dep_id,rel_id)
);
-- ddl-end --
COMMENT ON TABLE public.requester_dependent IS E'Tabla intermedia, vincula los consultantes con los menores de edad segun su parentesco';
-- ddl-end --
COMMENT ON COLUMN public.requester_dependent.req_id IS E'Identificador del consultante';
-- ddl-end --
COMMENT ON COLUMN public.requester_dependent.dep_id IS E'Identificador del dependiente (menor de edad)';
-- ddl-end --
COMMENT ON COLUMN public.requester_dependent.rel_id IS E'Identificador de la relacion (parentesco)';
-- ddl-end --
COMMENT ON COLUMN public.requester_dependent.rd_assigned_at IS E'Fecha y hora en la que un consultante registro a un menor de idad y definio su parentesco con este';
-- ddl-end --
ALTER TABLE public.requester_dependent OWNER TO postgres;
-- ddl-end --

-- object: "User_Person_fk" | type: CONSTRAINT --
-- ALTER TABLE public.users DROP CONSTRAINT IF EXISTS "User_Person_fk" CASCADE;
ALTER TABLE public.users ADD CONSTRAINT "User_Person_fk" FOREIGN KEY (use_id)
REFERENCES public.person (per_id) MATCH SIMPLE
ON DELETE NO ACTION ON UPDATE NO ACTION;
-- ddl-end --

-- object: "Psychologist_User_fk" | type: CONSTRAINT --
-- ALTER TABLE public.psychologist DROP CONSTRAINT IF EXISTS "Psychologist_User_fk" CASCADE;
ALTER TABLE public.psychologist ADD CONSTRAINT "Psychologist_User_fk" FOREIGN KEY (psy_id)
REFERENCES public.users (use_id) MATCH SIMPLE
ON DELETE NO ACTION ON UPDATE NO ACTION;
-- ddl-end --

-- object: "Schedule_Psychologist_fk" | type: CONSTRAINT --
-- ALTER TABLE public.schedule DROP CONSTRAINT IF EXISTS "Schedule_Psychologist_fk" CASCADE;
ALTER TABLE public.schedule ADD CONSTRAINT "Schedule_Psychologist_fk" FOREIGN KEY (psy_id)
REFERENCES public.psychologist (psy_id) MATCH SIMPLE
ON DELETE NO ACTION ON UPDATE NO ACTION;
-- ddl-end --

-- object: "Schedule_Appointment_fk" | type: CONSTRAINT --
-- ALTER TABLE public.schedule DROP CONSTRAINT IF EXISTS "Schedule_Appointment_fk" CASCADE;
ALTER TABLE public.schedule ADD CONSTRAINT "Schedule_Appointment_fk" FOREIGN KEY (app_id)
REFERENCES public.appointments (app_id) MATCH SIMPLE
ON DELETE NO ACTION ON UPDATE NO ACTION;
-- ddl-end --

-- object: "Appointment_Psychologist_fk" | type: CONSTRAINT --
-- ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS "Appointment_Psychologist_fk" CASCADE;
ALTER TABLE public.appointments ADD CONSTRAINT "Appointment_Psychologist_fk" FOREIGN KEY (psy_id)
REFERENCES public.psychologist (psy_id) MATCH SIMPLE
ON DELETE NO ACTION ON UPDATE NO ACTION;
-- ddl-end --

-- object: "Appointment_Secretary_fk" | type: CONSTRAINT --
-- ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS "Appointment_Secretary_fk" CASCADE;
ALTER TABLE public.appointments ADD CONSTRAINT "Appointment_Secretary_fk" FOREIGN KEY (sec_id)
REFERENCES public.users (use_id) MATCH SIMPLE
ON DELETE NO ACTION ON UPDATE NO ACTION;
-- ddl-end --

-- object: "Appointment_Requester_fk" | type: CONSTRAINT --
-- ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS "Appointment_Requester_fk" CASCADE;
ALTER TABLE public.appointments ADD CONSTRAINT "Appointment_Requester_fk" FOREIGN KEY (req_id)
REFERENCES public.person (per_id) MATCH SIMPLE
ON DELETE NO ACTION ON UPDATE NO ACTION;
-- ddl-end --

-- object: "Appointment_Pacient_fk" | type: CONSTRAINT --
-- ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS "Appointment_Pacient_fk" CASCADE;
ALTER TABLE public.appointments ADD CONSTRAINT "Appointment_Pacient_fk" FOREIGN KEY (app_patient_person_id)
REFERENCES public.person (per_id) MATCH SIMPLE
ON DELETE NO ACTION ON UPDATE NO ACTION;
-- ddl-end --

-- object: "Appointment_Dependent_fk" | type: CONSTRAINT --
-- ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS "Appointment_Dependent_fk" CASCADE;
ALTER TABLE public.appointments ADD CONSTRAINT "Appointment_Dependent_fk" FOREIGN KEY (app_patient_dependent_id)
REFERENCES public.dependents (dep_id) MATCH SIMPLE
ON DELETE NO ACTION ON UPDATE NO ACTION;
-- ddl-end --

-- object: "PR_Person" | type: CONSTRAINT --
-- ALTER TABLE public.person_rol DROP CONSTRAINT IF EXISTS "PR_Person" CASCADE;
ALTER TABLE public.person_rol ADD CONSTRAINT "PR_Person" FOREIGN KEY (per_id)
REFERENCES public.person (per_id) MATCH SIMPLE
ON DELETE NO ACTION ON UPDATE NO ACTION;
-- ddl-end --

-- object: "PR_Rol" | type: CONSTRAINT --
-- ALTER TABLE public.person_rol DROP CONSTRAINT IF EXISTS "PR_Rol" CASCADE;
ALTER TABLE public.person_rol ADD CONSTRAINT "PR_Rol" FOREIGN KEY (rol_id)
REFERENCES public.rol (rol_id) MATCH SIMPLE
ON DELETE NO ACTION ON UPDATE NO ACTION;
-- ddl-end --

-- object: "Donation_Donor_fk" | type: CONSTRAINT --
-- ALTER TABLE public.donations DROP CONSTRAINT IF EXISTS "Donation_Donor_fk" CASCADE;
ALTER TABLE public.donations ADD CONSTRAINT "Donation_Donor_fk" FOREIGN KEY (dono_id)
REFERENCES public.donors (dono_id) MATCH SIMPLE
ON DELETE NO ACTION ON UPDATE NO ACTION;
-- ddl-end --

-- object: "Donation_PMethod_fk" | type: CONSTRAINT --
-- ALTER TABLE public.donations DROP CONSTRAINT IF EXISTS "Donation_PMethod_fk" CASCADE;
ALTER TABLE public.donations ADD CONSTRAINT "Donation_PMethod_fk" FOREIGN KEY (pmet_id)
REFERENCES public.payment_method (pmet_id) MATCH SIMPLE
ON DELETE NO ACTION ON UPDATE NO ACTION;
-- ddl-end --

-- object: "RD_Requester_fk" | type: CONSTRAINT --
-- ALTER TABLE public.requester_dependent DROP CONSTRAINT IF EXISTS "RD_Requester_fk" CASCADE;
ALTER TABLE public.requester_dependent ADD CONSTRAINT "RD_Requester_fk" FOREIGN KEY (req_id)
REFERENCES public.person (per_id) MATCH SIMPLE
ON DELETE NO ACTION ON UPDATE NO ACTION;
-- ddl-end --

-- object: "RD_Dependent" | type: CONSTRAINT --
-- ALTER TABLE public.requester_dependent DROP CONSTRAINT IF EXISTS "RD_Dependent" CASCADE;
ALTER TABLE public.requester_dependent ADD CONSTRAINT "RD_Dependent" FOREIGN KEY (dep_id)
REFERENCES public.dependents (dep_id) MATCH SIMPLE
ON DELETE NO ACTION ON UPDATE NO ACTION;
-- ddl-end --

-- object: "RD_Relationship" | type: CONSTRAINT --
-- ALTER TABLE public.requester_dependent DROP CONSTRAINT IF EXISTS "RD_Relationship" CASCADE;
ALTER TABLE public.requester_dependent ADD CONSTRAINT "RD_Relationship" FOREIGN KEY (rel_id)
REFERENCES public.relationship (rel_id) MATCH SIMPLE
ON DELETE NO ACTION ON UPDATE NO ACTION;
-- ddl-end --


