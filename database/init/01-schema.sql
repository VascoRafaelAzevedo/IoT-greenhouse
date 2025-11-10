-- =====================================================
-- Apply Schema to Production Database
-- =====================================================
\c greenhouse

CREATE EXTENSION IF NOT EXISTS timescaledb;
CREATE EXTENSION IF NOT EXISTS pgcrypto;


CREATE TABLE public.timezone (
	id serial4 NOT NULL,
	tz_name text NOT NULL,
	utc_offset int4 NOT NULL,
	CONSTRAINT timezone_pkey PRIMARY KEY (id),
	CONSTRAINT timezone_utc_offset_check CHECK (((utc_offset >= '-11'::integer) AND (utc_offset <= 14)))
);



CREATE TABLE public.app_user (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	google_sub text NULL,
	email text NULL,
	display_name text NULL,
	timezone_id int4 NULL,
	created_at timestamptz DEFAULT now() NULL,
	last_login_at timestamptz NULL,
	phone_country_code text NULL,
	phone_number text NULL,
	password_hash text NULL,
	CONSTRAINT app_user_email_key UNIQUE (email),
	CONSTRAINT app_user_google_sub_key UNIQUE (google_sub),
	CONSTRAINT app_user_phone_unique UNIQUE (phone_country_code, phone_number),
	CONSTRAINT app_user_pkey PRIMARY KEY (id),
	CONSTRAINT app_user_timezone_id_fkey FOREIGN KEY (timezone_id) REFERENCES public.timezone(id)
);




CREATE TABLE public.greenhouse (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	owner_id uuid NOT NULL,
	"name" text DEFAULT ''::text NOT NULL,
	last_seen timestamptz NULL,
	created_at timestamptz DEFAULT now() NULL,
	CONSTRAINT greenhouse_pkey PRIMARY KEY (id),
	CONSTRAINT greenhouse_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.app_user(id) ON DELETE CASCADE
);



CREATE TABLE public.setpoint (
    greenhouse_id uuid PRIMARY KEY,  -- unique per greenhouse
    plant_name text NOT NULL,
    target_temp_min float8 NULL,
    target_temp_max float8 NULL,
    target_hum_air_max float8 NULL,
    irrigation_interval_minutes int4 NULL,
    irrigation_duration_seconds int4 NULL,
    target_light_intensity float8 NULL,
    changed_at timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT setpoint_greenhouse_id_fkey FOREIGN KEY (greenhouse_id) REFERENCES public.greenhouse(id) ON DELETE CASCADE
);

CREATE TABLE public.plants (
    plant_it uuid PRIMARY KEY,  -- unique per plant
	plant_name text NOT NULL,
	plant_descripion text NOT NULL,
    target_temp_min float8 NULL,
    target_temp_max float8 NULL,
    target_hum_air_max float8 NULL,
    irrigation_interval_minutes int4 NULL,
    irrigation_duration_seconds int4 NULL,
    target_light_intensity float8 NULL
);


CREATE TABLE public.connection_event (
    id bigserial PRIMARY KEY,
    greenhouse_id uuid NOT NULL,
    start_ts timestamptz NOT NULL,
    end_ts timestamptz NOT NULL,
    CONSTRAINT connection_event_greenhouse_id_fkey FOREIGN KEY (greenhouse_id)
        REFERENCES public.greenhouse(id) ON DELETE CASCADE
);

-- Index for faster queries by greenhouse and time
CREATE INDEX connection_event_gh_time_idx ON public.connection_event(greenhouse_id, start_ts DESC);


CREATE TABLE public.telemetry (
    time timestamptz NOT NULL,
    greenhouse_id uuid NOT NULL,
    sequence int8 NOT NULL,
    temp_air float8 NULL,
    hum_air float8 NULL,
    lux float8 NULL,
    light_intensity float8 NULL,
    light_on bool NULL,
    water_level_ok bool NULL,
    pump_on bool NULL,
    CONSTRAINT telemetry_pkey PRIMARY KEY (greenhouse_id, time, sequence),
    CONSTRAINT telemetry_greenhouse_id_fkey FOREIGN KEY (greenhouse_id) REFERENCES public.greenhouse(id) ON DELETE CASCADE
);



SELECT create_hypertable('telemetry','time', if_not_exists => TRUE);

CREATE INDEX IF NOT EXISTS telemetry_gh_time_idx 
  ON public.telemetry USING btree (greenhouse_id, "time" DESC);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'ts_insert_blocker'
    ) THEN
        CREATE TRIGGER ts_insert_blocker
        BEFORE INSERT ON public.telemetry
        FOR EACH ROW
        EXECUTE FUNCTION _timescaledb_functions.insert_blocker();
    END IF;
END$$;


-- =====================================================
-- Apply Schema to Test Database
-- =====================================================
\c greenhouse_test

CREATE EXTENSION IF NOT EXISTS timescaledb;
CREATE EXTENSION IF NOT EXISTS pgcrypto;


CREATE TABLE public.timezone (
	id serial4 NOT NULL,
	tz_name text NOT NULL,
	utc_offset int4 NOT NULL,
	CONSTRAINT timezone_pkey PRIMARY KEY (id),
	CONSTRAINT timezone_utc_offset_check CHECK (((utc_offset >= '-11'::integer) AND (utc_offset <= 14)))
);



CREATE TABLE public.app_user (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	google_sub text NULL,
	email text NULL,
	display_name text NULL,
	timezone_id int4 NULL,
	created_at timestamptz DEFAULT now() NULL,
	last_login_at timestamptz NULL,
	phone_country_code text NULL,
	phone_number text NULL,
	password_hash text NULL,
	CONSTRAINT app_user_email_key UNIQUE (email),
	CONSTRAINT app_user_google_sub_key UNIQUE (google_sub),
	CONSTRAINT app_user_phone_unique UNIQUE (phone_country_code, phone_number),
	CONSTRAINT app_user_pkey PRIMARY KEY (id),
	CONSTRAINT app_user_timezone_id_fkey FOREIGN KEY (timezone_id) REFERENCES public.timezone(id)
);




CREATE TABLE public.greenhouse (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	owner_id uuid NOT NULL,
	"name" text DEFAULT ''::text NOT NULL,
	last_seen timestamptz NULL,
	created_at timestamptz DEFAULT now() NULL,
	CONSTRAINT greenhouse_pkey PRIMARY KEY (id),
	CONSTRAINT greenhouse_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.app_user(id) ON DELETE CASCADE
);



CREATE TABLE public.setpoint (
    greenhouse_id uuid PRIMARY KEY,  -- unique per greenhouse
    plant_name text NOT NULL,
    target_temp_min float8 NULL,
    target_temp_max float8 NULL,
    target_hum_air_max float8 NULL,
    irrigation_interval_minutes int4 NULL,
    irrigation_duration_seconds int4 NULL,
    target_light_intensity float8 NULL,
    changed_at timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT setpoint_greenhouse_id_fkey FOREIGN KEY (greenhouse_id) REFERENCES public.greenhouse(id) ON DELETE CASCADE
);

CREATE TABLE public.plants (
    plant_it uuid PRIMARY KEY,  -- unique per plant
	plant_name text NOT NULL,
	plant_descripion text NOT NULL,
    target_temp_min float8 NULL,
    target_temp_max float8 NULL,
    target_hum_air_max float8 NULL,
    irrigation_interval_minutes int4 NULL,
    irrigation_duration_seconds int4 NULL,
    target_light_intensity float8 NULL
);


CREATE TABLE public.connection_event (
    id bigserial PRIMARY KEY,
    greenhouse_id uuid NOT NULL,
    start_ts timestamptz NOT NULL,
    end_ts timestamptz NOT NULL,
    CONSTRAINT connection_event_greenhouse_id_fkey FOREIGN KEY (greenhouse_id)
        REFERENCES public.greenhouse(id) ON DELETE CASCADE
);

-- Index for faster queries by greenhouse and time
CREATE INDEX connection_event_gh_time_idx ON public.connection_event(greenhouse_id, start_ts DESC);


CREATE TABLE public.telemetry (
    time timestamptz NOT NULL,
    greenhouse_id uuid NOT NULL,
    sequence int8 NOT NULL,
    temp_air float8 NULL,
    hum_air float8 NULL,
    lux float8 NULL,
    light_intensity float8 NULL,
    light_on bool NULL,
    water_level_ok bool NULL,
    pump_on bool NULL,
    CONSTRAINT telemetry_pkey PRIMARY KEY (greenhouse_id, time, sequence),
    CONSTRAINT telemetry_greenhouse_id_fkey FOREIGN KEY (greenhouse_id) REFERENCES public.greenhouse(id) ON DELETE CASCADE
);



SELECT create_hypertable('telemetry','time', if_not_exists => TRUE);

CREATE INDEX IF NOT EXISTS telemetry_gh_time_idx 
  ON public.telemetry USING btree (greenhouse_id, "time" DESC);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'ts_insert_blocker'
    ) THEN
        CREATE TRIGGER ts_insert_blocker
        BEFORE INSERT ON public.telemetry
        FOR EACH ROW
        EXECUTE FUNCTION _timescaledb_functions.insert_blocker();
    END IF;
END$$;