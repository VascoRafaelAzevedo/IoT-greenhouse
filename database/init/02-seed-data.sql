-- =====================================================
-- Seed Data for Production Database ONLY
-- =====================================================
-- This data will ONLY be inserted into 'greenhouse' database
-- The 'greenhouse_test' database will remain empty
-- =====================================================
\c greenhouse

INSERT INTO public.timezone (tz_name,utc_offset) VALUES
	 ('UTC-11',-11),
	 ('UTC-10',-10),
	 ('UTC-9',-9),
	 ('UTC-8',-8),
	 ('UTC-7',-7),
	 ('UTC-6',-6),
	 ('UTC-5',-5),
	 ('UTC-4',-4),
	 ('UTC-3',-3),
	 ('UTC-2',-2),
	 ('UTC-1',-1),
	 ('UTC+0',0),
	 ('UTC+1',1),
	 ('UTC+2',2),
	 ('UTC+3',3),
	 ('UTC+4',4),
	 ('UTC+5',5),
	 ('UTC+6',6),
	 ('UTC+7',7),
	 ('UTC+8',8),
	 ('UTC+9',9),
	 ('UTC+10',10),
	 ('UTC+11',11),
	 ('UTC+12',12),
	 ('UTC+13',13),
	 ('UTC+14',14);

INSERT INTO public.app_user (id,google_sub,email,display_name,timezone_id,created_at,last_login_at,phone_country_code,phone_number,password_hash) VALUES
	 ('e3279610-80a3-4d5d-a450-39b983d394b0'::uuid,NULL,'vasco@example.com','Vasco Silva',1,'2025-09-21 17:47:50.488204+02',NULL,'+351','912345678','hashed_password_1'),
	 ('0af4d832-ac77-4992-b057-cca9f7268f5c'::uuid,NULL,'maria@example.com','Maria Fernandes',2,'2025-09-21 17:47:50.488204+02',NULL,'+351','987654321','hashed_password_2');

INSERT INTO public.greenhouse (id,owner_id,device_id,"name",last_seen,created_at) VALUES
	 ('8ce70399-99f9-46dd-bfa0-af0b7b2f6978'::uuid,'e3279610-80a3-4d5d-a450-39b983d394b0'::uuid,'device_1','Estufa Vasco 1',NULL,'2025-09-21 17:50:25.871142+02'),
	 ('d848676c-8f33-49b5-a588-73f8e4ddbcf5'::uuid,'e3279610-80a3-4d5d-a450-39b983d394b0'::uuid,'device_2','Estufa Vasco 2',NULL,'2025-09-21 17:50:25.871142+02'),
	 ('89695209-7ced-4939-91ff-4d253761867d'::uuid,'0af4d832-ac77-4992-b057-cca9f7268f5c'::uuid,'device_3','Estufa Maria 1',NULL,'2025-09-21 17:50:25.871142+02'),
	 ('4880d428-7e4c-4ce2-8ce1-f866b5ec4bc0'::uuid,'0af4d832-ac77-4992-b057-cca9f7268f5c'::uuid,'device_4','Estufa Maria 2',NULL,'2025-09-21 17:50:25.871142+02');

INSERT INTO public.device (device_id,greenhouse_id,fw_version,rssi,created_at) VALUES
	 ('device_1','8ce70399-99f9-46dd-bfa0-af0b7b2f6978'::uuid,'v1.0.0',-50,'2025-09-21 17:50:25.871142+02'),
	 ('device_2','d848676c-8f33-49b5-a588-73f8e4ddbcf5'::uuid,'v1.0.0',-48,'2025-09-21 17:50:25.871142+02'),
	 ('device_3','89695209-7ced-4939-91ff-4d253761867d'::uuid,'v1.0.0',-52,'2025-09-21 17:50:25.871142+02'),
	 ('device_4','4880d428-7e4c-4ce2-8ce1-f866b5ec4bc0'::uuid,'v1.0.0',-49,'2025-09-21 17:50:25.871142+02');


INSERT INTO public.setpoint (greenhouse_id,target_temp,target_hum_ar,target_hum_solo,irrigation_interval_minutes,irrigation_duration_seconds,target_light_hours,target_light_intensity,light_threshold,created_at,changed_by) VALUES
	 ('8ce70399-99f9-46dd-bfa0-af0b7b2f6978'::uuid,24.0,55.0,40.0,60,30,12.0,500.0,20.0,'2025-09-21 18:37:51.169685+02','e3279610-80a3-4d5d-a450-39b983d394b0'::uuid),
	 ('8ce70399-99f9-46dd-bfa0-af0b7b2f6978'::uuid,24.5,54.0,41.0,55,35,12.0,520.0,20.0,'2025-09-21 18:37:51.169685+02','e3279610-80a3-4d5d-a450-39b983d394b0'::uuid),
	 ('8ce70399-99f9-46dd-bfa0-af0b7b2f6978'::uuid,25.0,53.0,42.0,60,30,12.5,540.0,22.0,'2025-09-21 18:37:51.169685+02','e3279610-80a3-4d5d-a450-39b983d394b0'::uuid),
	 ('8ce70399-99f9-46dd-bfa0-af0b7b2f6978'::uuid,24.8,52.5,42.5,65,25,12.0,530.0,30.0,'2025-09-21 18:37:51.169685+02','e3279610-80a3-4d5d-a450-39b983d394b0'::uuid),
	 ('8ce70399-99f9-46dd-bfa0-af0b7b2f6978'::uuid,25.2,53.5,41.5,60,30,13.0,550.0,10.0,'2025-09-21 18:37:51.169685+02','e3279610-80a3-4d5d-a450-39b983d394b0'::uuid),
	 ('8ce70399-99f9-46dd-bfa0-af0b7b2f6978'::uuid,25.0,54.0,42.0,55,30,12.5,540.0,50.0,'2025-09-21 18:37:51.169685+02','e3279610-80a3-4d5d-a450-39b983d394b0'::uuid),
	 ('8ce70399-99f9-46dd-bfa0-af0b7b2f6978'::uuid,24.5,55.0,41.0,60,35,12.0,520.0,40.0,'2025-09-21 18:37:51.169685+02','e3279610-80a3-4d5d-a450-39b983d394b0'::uuid);

INSERT INTO public.connection_event (greenhouse_id,event_type,start_ts,end_ts,created_at) VALUES
	 ('8ce70399-99f9-46dd-bfa0-af0b7b2f6978'::uuid,'online','2025-09-18 10:00:00+02','2025-09-18 14:30:00+02','2025-09-21 18:28:06.80226+02'),
	 ('8ce70399-99f9-46dd-bfa0-af0b7b2f6978'::uuid,'offline','2025-09-18 14:30:00+02','2025-09-18 15:00:00+02','2025-09-21 18:28:06.80226+02'),
	 ('8ce70399-99f9-46dd-bfa0-af0b7b2f6978'::uuid,'online','2025-09-18 15:00:00+02','2025-09-18 20:45:00+02','2025-09-21 18:28:06.80226+02'),
	 ('8ce70399-99f9-46dd-bfa0-af0b7b2f6978'::uuid,'offline','2025-09-18 20:45:00+02','2025-09-18 21:15:00+02','2025-09-21 18:28:06.80226+02'),
	 ('8ce70399-99f9-46dd-bfa0-af0b7b2f6978'::uuid,'online','2025-09-19 09:50:00+02','2025-09-19 13:20:00+02','2025-09-21 18:28:06.80226+02'),
	 ('8ce70399-99f9-46dd-bfa0-af0b7b2f6978'::uuid,'offline','2025-09-19 13:20:00+02','2025-09-19 13:45:00+02','2025-09-21 18:28:06.80226+02'),
	 ('8ce70399-99f9-46dd-bfa0-af0b7b2f6978'::uuid,'online','2025-09-19 13:45:00+02','2025-09-19 19:30:00+02','2025-09-21 18:28:06.80226+02'),
	 ('8ce70399-99f9-46dd-bfa0-af0b7b2f6978'::uuid,'online','2025-09-20 10:10:00+02','2025-09-20 14:00:00+02','2025-09-21 18:28:06.80226+02'),
	 ('8ce70399-99f9-46dd-bfa0-af0b7b2f6978'::uuid,'offline','2025-09-20 14:00:00+02','2025-09-20 14:30:00+02','2025-09-21 18:28:06.80226+02'),
	 ('8ce70399-99f9-46dd-bfa0-af0b7b2f6978'::uuid,'online','2025-09-20 14:30:00+02','2025-09-20 20:00:00+02','2025-09-21 18:28:06.80226+02');

INSERT INTO public.telemetry ("time",received_at,greenhouse_id,device_id,"sequence",temp_ar,hum_ar,hum_solo,lux,light_level_pct,light_power_w,nivel_agua_ok,pump_on,rssi,raw_payload) VALUES
	 ('2025-09-21 17:53:06.838632+02','2025-09-21 18:33:06.838632+02','8ce70399-99f9-46dd-bfa0-af0b7b2f6978'::uuid,'device_1',1,22.5,55.0,40.0,300.0,75.0,20.0,true,false,-50,'{"mock": "data1"}'),
	 ('2025-09-21 17:54:06.838632+02','2025-09-21 18:33:06.838632+02','8ce70399-99f9-46dd-bfa0-af0b7b2f6978'::uuid,'device_1',2,22.6,54.8,40.2,310.0,77.0,21.0,true,false,-50,'{"mock": "data2"}'),
	 ('2025-09-21 17:55:06.838632+02','2025-09-21 18:33:06.838632+02','8ce70399-99f9-46dd-bfa0-af0b7b2f6978'::uuid,'device_1',3,22.7,54.5,40.5,320.0,78.0,22.0,true,false,-50,'{"mock": "data3"}'),
	 ('2025-09-21 17:56:06.838632+02','2025-09-21 18:33:06.838632+02','8ce70399-99f9-46dd-bfa0-af0b7b2f6978'::uuid,'device_1',4,22.8,54.3,40.7,330.0,80.0,22.5,true,false,-50,'{"mock": "data4"}'),
	 ('2025-09-21 17:57:06.838632+02','2025-09-21 18:33:06.838632+02','8ce70399-99f9-46dd-bfa0-af0b7b2f6978'::uuid,'device_1',5,22.9,54.0,41.0,340.0,82.0,23.0,true,false,-50,'{"mock": "data5"}'),
	 ('2025-09-21 17:58:06.838632+02','2025-09-21 18:33:06.838632+02','8ce70399-99f9-46dd-bfa0-af0b7b2f6978'::uuid,'device_1',6,23.0,53.8,41.2,350.0,83.0,23.5,true,false,-50,'{"mock": "data6"}'),
	 ('2025-09-21 17:59:06.838632+02','2025-09-21 18:33:06.838632+02','8ce70399-99f9-46dd-bfa0-af0b7b2f6978'::uuid,'device_1',7,23.1,53.5,41.5,360.0,85.0,24.0,true,false,-50,'{"mock": "data7"}'),
	 ('2025-09-21 18:00:06.838632+02','2025-09-21 18:33:06.838632+02','8ce70399-99f9-46dd-bfa0-af0b7b2f6978'::uuid,'device_1',8,23.2,53.3,41.7,370.0,86.0,24.5,true,false,-50,'{"mock": "data8"}'),
	 ('2025-09-21 18:01:06.838632+02','2025-09-21 18:33:06.838632+02','8ce70399-99f9-46dd-bfa0-af0b7b2f6978'::uuid,'device_1',9,23.3,53.0,42.0,380.0,88.0,25.0,true,false,-50,'{"mock": "data9"}'),
	 ('2025-09-21 18:02:06.838632+02','2025-09-21 18:33:06.838632+02','8ce70399-99f9-46dd-bfa0-af0b7b2f6978'::uuid,'device_1',10,23.4,52.8,42.2,390.0,90.0,25.5,true,false,-50,'{"mock": "data10"}');

