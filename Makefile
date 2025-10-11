# GardenAway Makefile - developer ergonomics

PROJECT_NAME=gardenaway-iot
COMPOSE=docker compose

# Default target
.PHONY: help
help:
	@echo "Available targets:"; \
	egrep '^[-a-zA-Z_0-9]+:' Makefile | cut -d: -f1 | sort

.PHONY: up
up:
	$(COMPOSE) -f docker-compose.yml up -d

.PHONY: up-dev
up-dev:
	$(COMPOSE) -f docker-compose.yml -f docker-compose.dev.yml up --build

.PHONY: up-prod
up-prod:
	$(COMPOSE) -f docker-compose.yml -f docker-compose.prod.yml up -d --build

.PHONY: down
down:
	$(COMPOSE) -f docker-compose.yml down

.PHONY: logs
logs:
	$(COMPOSE) -f docker-compose.yml logs -f --tail=200

.PHONY: api-shell
api-shell:
	docker exec -it gardenaway-api sh || true

.PHONY: psql
psql:
	docker exec -it gardenaway-postgres psql -U $$DB_USER -d $$DB_NAME

.PHONY: psql-test
psql-test:
	docker exec -it gardenaway-postgres psql -U $$DB_USER -d $$DB_NAME_TEST

.PHONY: db-status
db-status:
	@echo "=== Database Status ==="
	@docker exec gardenaway-postgres psql -U postgres -c "\\l" | grep -E "greenhouse|Name" || true
	@echo ""
	@echo "=== Production Database (greenhouse) ==="
	@docker exec gardenaway-postgres psql -U postgres -d greenhouse -c "SELECT 'app_user' as table, COUNT(*) FROM app_user UNION ALL SELECT 'greenhouse', COUNT(*) FROM greenhouse UNION ALL SELECT 'device', COUNT(*) FROM device UNION ALL SELECT 'telemetry', COUNT(*) FROM telemetry;"
	@echo ""
	@echo "=== Test Database (greenhouse_test) ==="
	@docker exec gardenaway-postgres psql -U postgres -d greenhouse_test -c "SELECT 'app_user' as table, COUNT(*) FROM app_user UNION ALL SELECT 'greenhouse', COUNT(*) FROM greenhouse UNION ALL SELECT 'device', COUNT(*) FROM device UNION ALL SELECT 'telemetry', COUNT(*) FROM telemetry;"

.PHONY: mqtt-sub
mqtt-sub:
	docker exec -it gardenaway-mosquitto mosquitto_sub -h localhost -t '#' -u $$MQTT_USER -P $$MQTT_PASSWORD -v

.PHONY: mqtt-pub
mqtt-pub:
	docker exec -it gardenaway-mosquitto mosquitto_pub -h localhost -t test/topic -m 'hello' -u $$MQTT_USER -P $$MQTT_PASSWORD

.PHONY: clean
clean:
	$(COMPOSE) -f docker-compose.yml down -v

.PHONY: build
build:
	$(COMPOSE) -f docker-compose.yml build

.PHONY: validate-env
validate-env:
	@bash -c 'missing=0; for v in DB_USER DB_PASSWORD DB_NAME MQTT_USER MQTT_PASSWORD API_SECRET_KEY; do \
	 if [ -z "$$($$SHELL -c "echo $$$$${v}")" ]; then echo "Missing $$v"; missing=1; fi; done; exit $$missing'
