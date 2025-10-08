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
	device_id text NULL,
	"name" text DEFAULT ''::text NOT NULL,
	last_seen timestamptz NULL,
	created_at timestamptz DEFAULT now() NULL,
	CONSTRAINT greenhouse_device_id_key UNIQUE (device_id),
	CONSTRAINT greenhouse_pkey PRIMARY KEY (id),
	CONSTRAINT greenhouse_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.app_user(id) ON DELETE CASCADE
);



CREATE TABLE public.setpoint (
	id bigserial NOT NULL,
	greenhouse_id uuid NOT NULL,
	target_temp float8 NULL,
	target_hum_ar float8 NULL,
	target_hum_solo float8 NULL,
	irrigation_interval_minutes int4 NULL,
	irrigation_duration_seconds int4 NULL,
	target_light_hours float8 NULL,
	target_light_intensity float8 NULL,
	light_threshold float8 NULL,
	created_at timestamptz DEFAULT now() NULL,
	changed_by uuid NULL,
	CONSTRAINT setpoint_pkey PRIMARY KEY (id),
	CONSTRAINT setpoint_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.app_user(id),
	CONSTRAINT setpoint_greenhouse_id_fkey FOREIGN KEY (greenhouse_id) REFERENCES public.greenhouse(id) ON DELETE CASCADE
);
CREATE INDEX setpoint_latest_idx ON public.setpoint USING btree (greenhouse_id, created_at DESC);


CREATE TABLE public.connection_event (
	id bigserial NOT NULL,
	greenhouse_id uuid NOT NULL,
	event_type text NOT NULL,
	start_ts timestamptz NOT NULL,
	end_ts timestamptz NULL,
	created_at timestamptz DEFAULT now() NULL,
	CONSTRAINT connection_event_event_type_check CHECK ((event_type = ANY (ARRAY['online'::text, 'offline'::text]))),
	CONSTRAINT connection_event_pkey PRIMARY KEY (id),
	CONSTRAINT connection_event_greenhouse_id_fkey FOREIGN KEY (greenhouse_id) REFERENCES public.greenhouse(id) ON DELETE CASCADE
);
CREATE INDEX connection_event_gh_start_idx ON public.connection_event USING btree (greenhouse_id, start_ts DESC);



CREATE TABLE public.device (
	device_id text NOT NULL,
	greenhouse_id uuid NULL,
	fw_version text NULL,
	rssi int4 NULL,
	created_at timestamptz DEFAULT now() NULL,
	CONSTRAINT device_pkey PRIMARY KEY (device_id),
	CONSTRAINT device_greenhouse_id_fkey FOREIGN KEY (greenhouse_id) REFERENCES public.greenhouse(id) ON DELETE CASCADE
);



CREATE TABLE public.telemetry (
	"time" timestamptz NOT NULL,
	received_at timestamptz DEFAULT now() NOT NULL,
	greenhouse_id uuid NOT NULL,
	device_id text NOT NULL,
	"sequence" int8 NOT NULL,
	temp_ar float8 NULL,
	hum_ar float8 NULL,
	hum_solo float8 NULL,
	lux float8 NULL,
	light_level_pct float8 NULL,
	light_power_w float8 NULL,
	nivel_agua_ok bool NULL,
	pump_on bool NULL,
	rssi int4 NULL,
	raw_payload jsonb NULL,
	CONSTRAINT telemetry_pkey PRIMARY KEY (device_id, "time", sequence),
	CONSTRAINT telemetry_device_id_fkey FOREIGN KEY (device_id) REFERENCES public.device(device_id) ON DELETE CASCADE,
	CONSTRAINT telemetry_greenhouse_id_fkey FOREIGN KEY (greenhouse_id) REFERENCES public.greenhouse(id) ON DELETE CASCADE
);


SELECT create_hypertable('telemetry','time', if_not_exists => TRUE);

CREATE INDEX IF NOT EXISTS telemetry_device_time_idx 
  ON public.telemetry USING btree (device_id, "time" DESC);

CREATE INDEX IF NOT EXISTS telemetry_gh_time_idx 
  ON public.telemetry USING btree (greenhouse_id, "time" DESC);

CREATE INDEX IF NOT EXISTS telemetry_received_idx 
  ON public.telemetry USING btree (received_at DESC);

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
