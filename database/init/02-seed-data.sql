-- =====================================================
-- Seed Data for Production Database ONLY
-- =====================================================
-- This data will ONLY be inserted into 'greenhouse' database
-- The 'greenhouse_test' database will remain empty
-- =====================================================
\c greenhouse

-- Insert timezones
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

INSERT INTO public.plants (plant_id,plant_name,plant_descripion,target_temp_min,target_temp_max,target_hum_air_max,irrigation_interval_minutes,irrigation_duration_seconds,target_light_intensity) VALUES
	 ('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6'::uuid,'Tomato','Classic red tomato variety for greenhouse cultivation',18.0,28.0,80.0,120,45,600.0),
	 ('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7'::uuid,'Lettuce','Green leafy lettuce, ideal for salads',15.0,22.0,70.0,180,30,400.0),
	 ('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8'::uuid,'Cucumber','Long green cucumber for fresh consumption',20.0,30.0,85.0,90,50,550.0),
	 ('d4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e8f9'::uuid,'Basil','Aromatic herb for culinary use',20.0,27.0,75.0,150,35,500.0),
	 ('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f9a0'::uuid,'Bell Pepper','Sweet red bell pepper variety',21.0,29.0,80.0,100,40,580.0),
	 ('f6a7b8c9-d0e1-42f3-a4b5-c6d7e8f9a0b1'::uuid,'Strawberry','Sweet strawberry for fresh eating',18.0,25.0,80.0,140,40,450.0),
	 ('a7b8c9d0-e1f2-43a4-b5c6-d7e8f9a0b1c2'::uuid,'Mint','Fresh mint herb for teas and garnish',15.0,24.0,75.0,160,35,400.0),
	 ('b8c9d0e1-f2a3-44b5-c6d7-e8f9a0b1c2d3'::uuid,'Spinach','Nutrient-rich leafy green vegetable',15.0,21.0,70.0,170,30,380.0),
	 ('c9d0e1f2-a3b4-45c6-d7e8-f9a0b1c2d3e4'::uuid,'Zucchini','Green summer squash for grilling',18.0,28.0,80.0,110,45,560.0),
	 ('d0e1f2a3-b4c5-46d7-e8f9-a0b1c2d3e4f5'::uuid,'Parsley','Curly parsley herb for garnishing',16.0,24.0,75.0,155,35,420.0),
	 ('e1f2a3b4-c5d6-47e8-f9a0-b1c2d3e4f5a6'::uuid,'Chili Pepper','Hot chili pepper for spicy dishes',22.0,30.0,75.0,95,40,600.0),
	 ('f2a3b4c5-d6e7-48f9-a0b1-c2d3e4f5a6b7'::uuid,'Eggplant','Purple eggplant for Mediterranean dishes',22.0,30.0,80.0,105,45,570.0),
	 ('a3b4c5d6-e7f8-49a0-b1c2-d3e4f5a6b7c8'::uuid,'Carrot','Orange root vegetable rich in vitamins',16.0,24.0,75.0,130,35,450.0),
	 ('b4c5d6e7-f8a9-40b1-c2d3-e4f5a6b7c8d9'::uuid,'Radish','Crisp red radish for salads',15.0,22.0,70.0,145,30,400.0),
	 ('c5d6e7f8-a9b0-41c2-d3e4-f5a6b7c8d9e0'::uuid,'Thyme','Aromatic Mediterranean herb',18.0,26.0,70.0,165,35,480.0);

\c greenhouse_test

-- Insert timezones
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

-- Insert users
INSERT INTO public.app_user (id,google_sub,email,display_name,timezone_id,created_at,last_login_at,phone_country_code,phone_number,password_hash) VALUES
	 ('e3279610-80a3-4d5d-a450-39b983d394b0'::uuid,NULL,'vasco@example.com','Vasco Silva',1,'2025-09-21 17:47:50.488204+02',NULL,'+351','912345678','$2b$10$5.keU/H1DxAxOPsoJeyPmebUq7giI1islw4M5vI7rO8UHlTwDL1qG'),
	 ('0af4d832-ac77-4992-b057-cca9f7268f5c'::uuid,NULL,'maria@example.com','Maria Fernandes',2,'2025-09-21 17:47:50.488204+02',NULL,'+351','987654321','$2b$10$5.keU/H1DxAxOPsoJeyPmebUq7giI1islw4M5vI7rO8UHlTwDL1qG');

-- Insert greenhouses
INSERT INTO public.greenhouse (id,owner_id,"name",last_seen,created_at) VALUES
	 ('8ce70399-99f9-46dd-bfa0-af0b7b2f6978'::uuid,'e3279610-80a3-4d5d-a450-39b983d394b0'::uuid,'Greenhouse 1','2025-11-18 19:00:00+02','2025-09-21 17:50:25.871142+02'),
	 ('d848676c-8f33-49b5-a588-73f8e4ddbcf5'::uuid,'e3279610-80a3-4d5d-a450-39b983d394b0'::uuid,'Greenhouse 2','2025-10-14 09:15:00+02','2025-09-21 17:50:25.871142+02'),
	 ('89695209-7ced-4939-91ff-4d253761867d'::uuid,'0af4d832-ac77-4992-b057-cca9f7268f5c'::uuid,'Estufa Maria 1','2025-10-14 11:00:00+02','2025-09-21 17:50:25.871142+02'),
	 ('4880d428-7e4c-4ce2-8ce1-f866b5ec4bc0'::uuid,'0af4d832-ac77-4992-b057-cca9f7268f5c'::uuid,'Estufa Maria 2','2025-10-13 23:45:00+02','2025-09-21 17:50:25.871142+02');

-- Insert 15 plants
INSERT INTO public.plants (plant_id,plant_name,plant_descripion,target_temp_min,target_temp_max,target_hum_air_max,irrigation_interval_minutes,irrigation_duration_seconds,target_light_intensity) VALUES
	 ('a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6'::uuid,'Tomato','Classic red tomato variety for greenhouse cultivation',18.0,28.0,80.0,120,45,600.0),
	 ('b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7'::uuid,'Lettuce','Green leafy lettuce, ideal for salads',15.0,22.0,70.0,180,30,400.0),
	 ('c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8'::uuid,'Cucumber','Long green cucumber for fresh consumption',20.0,30.0,85.0,90,50,550.0),
	 ('d4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e8f9'::uuid,'Basil','Aromatic herb for culinary use',20.0,27.0,75.0,150,35,500.0),
	 ('e5f6a7b8-c9d0-41e2-f3a4-b5c6d7e8f9a0'::uuid,'Bell Pepper','Sweet red bell pepper variety',21.0,29.0,80.0,100,40,580.0),
	 ('f6a7b8c9-d0e1-42f3-a4b5-c6d7e8f9a0b1'::uuid,'Strawberry','Sweet strawberry for fresh eating',18.0,25.0,80.0,140,40,450.0),
	 ('a7b8c9d0-e1f2-43a4-b5c6-d7e8f9a0b1c2'::uuid,'Mint','Fresh mint herb for teas and garnish',15.0,24.0,75.0,160,35,400.0),
	 ('b8c9d0e1-f2a3-44b5-c6d7-e8f9a0b1c2d3'::uuid,'Spinach','Nutrient-rich leafy green vegetable',15.0,21.0,70.0,170,30,380.0),
	 ('c9d0e1f2-a3b4-45c6-d7e8-f9a0b1c2d3e4'::uuid,'Zucchini','Green summer squash for grilling',18.0,28.0,80.0,110,45,560.0),
	 ('d0e1f2a3-b4c5-46d7-e8f9-a0b1c2d3e4f5'::uuid,'Parsley','Curly parsley herb for garnishing',16.0,24.0,75.0,155,35,420.0),
	 ('e1f2a3b4-c5d6-47e8-f9a0-b1c2d3e4f5a6'::uuid,'Chili Pepper','Hot chili pepper for spicy dishes',22.0,30.0,75.0,95,40,600.0),
	 ('f2a3b4c5-d6e7-48f9-a0b1-c2d3e4f5a6b7'::uuid,'Eggplant','Purple eggplant for Mediterranean dishes',22.0,30.0,80.0,105,45,570.0),
	 ('a3b4c5d6-e7f8-49a0-b1c2-d3e4f5a6b7c8'::uuid,'Carrot','Orange root vegetable rich in vitamins',16.0,24.0,75.0,130,35,450.0),
	 ('b4c5d6e7-f8a9-40b1-c2d3-e4f5a6b7c8d9'::uuid,'Radish','Crisp red radish for salads',15.0,22.0,70.0,145,30,400.0),
	 ('c5d6e7f8-a9b0-41c2-d3e4-f5a6b7c8d9e0'::uuid,'Thyme','Aromatic Mediterranean herb',18.0,26.0,70.0,165,35,480.0);

-- Insert setpoints (one per greenhouse)
INSERT INTO public.setpoint (greenhouse_id,plant_name,target_temp_min,target_temp_max,target_hum_air_max,irrigation_interval_minutes,irrigation_duration_seconds,target_light_intensity,changed_at) VALUES
	 ('8ce70399-99f9-46dd-bfa0-af0b7b2f6978'::uuid,'Tomato',20.0,28.0,70.0,120,40,550.0,'2025-10-14 08:00:00+02'),
	 ('d848676c-8f33-49b5-a588-73f8e4ddbcf5'::uuid,'Lettuce',18.0,26.0,75.0,150,35,500.0,'2025-10-14 07:30:00+02'),
	 ('89695209-7ced-4939-91ff-4d253761867d'::uuid,'Strawberry',22.0,30.0,80.0,100,45,600.0,'2025-10-14 09:00:00+02'),
	 ('4880d428-7e4c-4ce2-8ce1-f866b5ec4bc0'::uuid,'Bell Pepper',19.0,27.0,75.0,130,38,520.0,'2025-10-13 20:00:00+02');

-- Insert connection events
INSERT INTO public.connection_event (greenhouse_id,start_ts,end_ts) VALUES
	 ('8ce70399-99f9-46dd-bfa0-af0b7b2f6978'::uuid,'2025-10-12 08:00:00+02','2025-10-12 12:30:00+02'),
	 ('8ce70399-99f9-46dd-bfa0-af0b7b2f6978'::uuid,'2025-10-12 12:30:00+02','2025-10-12 13:00:00+02'),
	 ('8ce70399-99f9-46dd-bfa0-af0b7b2f6978'::uuid,'2025-10-12 13:00:00+02','2025-10-12 18:45:00+02'),
	 ('8ce70399-99f9-46dd-bfa0-af0b7b2f6978'::uuid,'2025-10-13 09:15:00+02','2025-10-13 14:20:00+02'),
	 ('8ce70399-99f9-46dd-bfa0-af0b7b2f6978'::uuid,'2025-10-13 14:20:00+02','2025-10-13 14:45:00+02'),
	 ('8ce70399-99f9-46dd-bfa0-af0b7b2f6978'::uuid,'2025-10-13 14:45:00+02','2025-10-13 20:30:00+02'),
	 ('8ce70399-99f9-46dd-bfa0-af0b7b2f6978'::uuid,'2025-10-14 07:50:00+02','2025-10-14 11:00:00+02'),
	 ('d848676c-8f33-49b5-a588-73f8e4ddbcf5'::uuid,'2025-10-13 10:00:00+02','2025-10-13 15:30:00+02'),
	 ('89695209-7ced-4939-91ff-4d253761867d'::uuid,'2025-10-12 09:00:00+02','2025-10-12 17:00:00+02'),
	 ('4880d428-7e4c-4ce2-8ce1-f866b5ec4bc0'::uuid,'2025-10-13 08:30:00+02','2025-10-13 23:45:00+02');

-- Insert telemetry data
INSERT INTO public.telemetry ("time",greenhouse_id,"sequence",temp_air,hum_air,lux,light_intensity,light_on,water_level_ok,pump_on) VALUES
	 ('2025-10-14 08:00:00+02','8ce70399-99f9-46dd-bfa0-af0b7b2f6978'::uuid,1,22.5,55.0,320.0,65.0,true,true,false),
	 ('2025-10-14 08:05:00+02','8ce70399-99f9-46dd-bfa0-af0b7b2f6978'::uuid,2,22.7,54.8,335.0,68.0,true,true,false),
	 ('2025-10-14 08:10:00+02','8ce70399-99f9-46dd-bfa0-af0b7b2f6978'::uuid,3,23.0,54.5,350.0,70.0,true,true,false),
	 ('2025-10-14 08:15:00+02','8ce70399-99f9-46dd-bfa0-af0b7b2f6978'::uuid,4,23.2,54.2,365.0,72.0,true,true,false),
	 ('2025-10-14 08:20:00+02','8ce70399-99f9-46dd-bfa0-af0b7b2f6978'::uuid,5,23.5,54.0,380.0,75.0,true,true,true),
	 ('2025-10-14 08:25:00+02','8ce70399-99f9-46dd-bfa0-af0b7b2f6978'::uuid,6,23.8,53.8,395.0,77.0,true,true,false),
	 ('2025-10-14 08:30:00+02','8ce70399-99f9-46dd-bfa0-af0b7b2f6978'::uuid,7,24.0,53.5,410.0,80.0,true,true,false),
	 ('2025-10-14 08:35:00+02','8ce70399-99f9-46dd-bfa0-af0b7b2f6978'::uuid,8,24.2,53.3,425.0,82.0,true,true,false),
	 ('2025-10-14 08:40:00+02','8ce70399-99f9-46dd-bfa0-af0b7b2f6978'::uuid,9,24.5,53.0,440.0,85.0,true,true,false),
	 ('2025-10-14 08:45:00+02','8ce70399-99f9-46dd-bfa0-af0b7b2f6978'::uuid,10,24.7,52.8,455.0,87.0,true,true,false);

