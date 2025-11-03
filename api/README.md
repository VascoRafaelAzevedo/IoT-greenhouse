# IoT Greenhouse API

API REST em Flask para o sistema IoT Greenhouse com autenticação JWT e integração MQTT.

## 🏗️ Arquitetura

```
api/
├── src/                      # Código fonte principal
│   ├── __init__.py
│   ├── app.py               # Aplicação Flask principal
│   ├── models.py            # Modelos SQLAlchemy (BD)
│   ├── database.py          # Configuração da base de dados
│   ├── auth.py              # Autenticação JWT
│   ├── mqtt_client.py       # Cliente MQTT para publicar setpoints
│   ├── validators.py        # Validações de input
│   ├── utils.py             # Utilitários (serialização, etc.)
│   └── routes/              # Endpoints organizados
│       ├── __init__.py
│       ├── auth.py          # POST /register, /login, GET/PUT/DEL /me
│       ├── greenhouses.py   # CRUD greenhouses
│       ├── setpoints.py     # GET/PUT setpoints
│       ├── telemetry.py     # GET telemetry (read-only)
│       ├── connections.py   # GET connection events (read-only)
│       ├── plants.py        # GET plants (read-only)
│       └── timezones.py     # GET timezones (public)
├── requirements.txt         # Dependências Python
├── Dockerfile              # Container image
├── wsgi.py                 # Entry point para produção
├── test_api.py             # Script para testar localmente
└── test_db_connection.py   # Script para testar conexão BD
```

## 🚀 Setup Rápido

### 1. Ativar Ambiente Virtual

```bash
cd /home/vasco-debian/Desktop/DEV/Versioned/College/IoT-greenhouse
source .venv/bin/activate
```

### 2. Instalar Dependências

```bash
cd api
pip install -r requirements.txt
```

### 3. Configurar Variáveis de Ambiente

As variáveis de ambiente estão no ficheiro `.env` **na raiz do projeto** (não na pasta api/).

Principais variáveis:
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `API_SECRET_KEY` - chave secreta Flask
- `JWT_SECRET` - chave para assinar tokens JWT
- `JWT_EXP_DAYS` - expiração do token (default: 30 dias)
- `MQTT_HOST`, `MQTT_PORT` - broker MQTT
- `CORS_ALLOWED_ORIGINS` - origens permitidas (default: *)

### 4. Iniciar Base de Dados

```bash
# Na raiz do projeto
docker compose up postgres -d
```

### 5. Testar Conexão

```bash
cd api
python test_db_connection.py
```

### 6. Iniciar API

```bash
cd api
python test_api.py
```

A API estará disponível em **http://localhost:5000**

## 📡 Endpoints da API

### 🔐 Autenticação

Todos os endpoints (exceto `/health`, `/api/auth/register`, `/api/auth/login` e `/api/timezones`) **requerem autenticação JWT**.

**Header obrigatório:**
```
Authorization: Bearer <token>
```

#### `POST /api/auth/register`
Registar novo utilizador.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "securepass123",
  "display_name": "João Silva",
  "timezone_id": 1
}
```

**Response 201:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "display_name": "João Silva",
  "timezone_id": 1,
  "token": "eyJ0eXAiOiJKV1QiLCJ..."
}
```

#### `POST /api/auth/login`
Login com email e password.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "securepass123"
}
```

**Response 200:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "display_name": "João Silva",
  "token": "eyJ0eXAiOiJKV1QiLCJ..."
}
```

#### `GET /api/auth/me`
Obter informação do utilizador autenticado.

**Response 200:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "display_name": "João Silva",
  "timezone_id": 1
}
```

#### `PUT /api/auth/me`
Atualizar perfil do utilizador.

**Body (campos opcionais):**
```json
{
  "display_name": "Novo Nome",
  "timezone_id": 2
}
```

#### `DELETE /api/auth/me`
Apagar conta do utilizador.

**Response: 204 No Content**

---

### 🏡 Greenhouses

#### `GET /api/greenhouses`
Listar estufas do utilizador autenticado.

**Response 200:**
```json
[
  {
    "id": "uuid",
    "owner_id": "user-uuid",
    "name": "Minha Estufa",
    "last_seen": "2025-11-03T10:30:00+00:00",
    "created_at": "2025-01-01T12:00:00+00:00"
  }
]
```

#### `GET /api/greenhouses/<id>`
Obter estufa por ID (apenas se for owner).

#### `POST /api/greenhouses`
Criar nova estufa.

**Body:**
```json
{
  "name": "Estufa Nova"
}
```

#### `PUT /api/greenhouses/<id>`
Atualizar nome da estufa.

**Body:**
```json
{
  "name": "Nome Atualizado"
}
```

#### `DELETE /api/greenhouses/<id>`
Apagar estufa.

**Response: 204 No Content**

---

### 🎯 Setpoints

#### `GET /api/greenhouses/<id>/setpoint`
Obter setpoint de uma estufa.

**Response 200:**
```json
{
  "greenhouse_id": "uuid",
  "target_temp_min": 18.0,
  "target_temp_max": 25.0,
  "target_hum_air_max": 70.0,
  "irrigation_interval_minutes": 60,
  "irrigation_duration_seconds": 30,
  "target_light_intensity": 500.0,
  "changed_at": "2025-11-03T10:30:00+00:00"
}
```

#### `PUT /api/greenhouses/<id>/setpoint`
Atualizar setpoint (todos os campos obrigatórios).

**⚠️ Importante:** 
- Todos os parâmetros são obrigatórios
- Valida ranges de valores
- **Publica automaticamente no MQTT** → `greenhouse/{id}/setpoints`

**Body:**
```json
{
  "target_temp_min": 18.0,
  "target_temp_max": 25.0,
  "target_hum_air_max": 70.0,
  "irrigation_interval_minutes": 60,
  "irrigation_duration_seconds": 30,
  "target_light_intensity": 500.0
}
```

**Validações:**
- `target_temp_min`: 0-40°C
- `target_temp_max`: 0-50°C (> min)
- `target_hum_air_max`: 0-100%
- `irrigation_interval_minutes`: 1-1440 (24h)
- `irrigation_duration_seconds`: 1-600 (10min)
- `target_light_intensity`: 0-100000 lux

---

### 📊 Telemetry (Read-Only)

#### `GET /api/greenhouses/<id>/telemetry`
Obter dados de telemetria.

**Query Parameters:**
- `days`: int (1-365) - últimos N dias (default: 7)
- `start_date`: ISO date - data inicial (ex: 2025-01-01)
- `end_date`: ISO date - data final (ex: 2025-01-31)
- `limit`: int (1-10000) - máximo de registos (default: 1000)

**Exemplos:**
```bash
# Últimos 7 dias (default)
GET /api/greenhouses/<id>/telemetry

# Últimos 30 dias
GET /api/greenhouses/<id>/telemetry?days=30

# Intervalo específico
GET /api/greenhouses/<id>/telemetry?start_date=2025-01-01&end_date=2025-01-31

# Com limite
GET /api/greenhouses/<id>/telemetry?days=100&limit=5000
```

**Response 200:**
```json
{
  "count": 100,
  "data": [
    {
      "time": "2025-11-03T10:30:00+00:00",
      "greenhouse_id": "uuid",
      "sequence": 1,
      "temp_air": 22.5,
      "hum_air": 65.0,
      "lux": 15000.0,
      "light_intensity": 80.0,
      "light_on": true,
      "water_level_ok": true,
      "pump_on": false
    }
  ]
}
```

#### `GET /api/greenhouses/<id>/telemetry/latest`
Obter última leitura de telemetria.

---

### 🔌 Connection Events (Read-Only)

#### `GET /api/greenhouses/<id>/connections`
Obter eventos de conexão/desconexão do ESP32.

**Query Parameters:**
- `limit`: int (1-500, default: 50)

**Response 200:**
```json
{
  "count": 10,
  "data": [
    {
      "id": 1,
      "greenhouse_id": "uuid",
      "start_ts": "2025-11-03T10:00:00+00:00",
      "end_ts": "2025-11-03T10:05:00+00:00"
    }
  ]
}
```

---

### 🌱 Plants (Read-Only)

#### `GET /api/plants`
Listar todos os templates de plantas.

#### `GET /api/plants/<id>`
Obter planta por ID.

**Response 200:**
```json
{
  "plant_it": "uuid",
  "plant_name": "Tomate",
  "plant_descripion": "Solanum lycopersicum",
  "target_temp_min": 18.0,
  "target_temp_max": 27.0,
  "target_hum_air_max": 70.0,
  "irrigation_interval_minutes": 120,
  "irrigation_duration_seconds": 45,
  "target_light_intensity": 20000.0
}
```

---

### 🌍 Timezones (Public)

#### `GET /api/timezones`
Listar todos os timezones disponíveis (não requer autenticação).

---

## 🔗 Integração MQTT

A API publica mensagens MQTT quando setpoints são atualizados.

**Tópico:** `greenhouse/{greenhouse_id}/setpoints`

**Payload:**
```json
{
  "target_temp_min": 18.0,
  "target_temp_max": 25.0,
  "target_hum_air_max": 70.0,
  "irrigation_interval_minutes": 60,
  "irrigation_duration_seconds": 30,
  "target_light_intensity": 500.0,
  "changed_at": "2025-11-03T10:30:00+00:00"
}
```

O ESP32 subscreve este tópico e atualiza os seus parâmetros de controlo.

---

## 🔒 Segurança

- **Passwords**: Hash com bcrypt
- **Tokens JWT**: Expiram em 30 dias (configurável)
- **Autorização**: Cada user só acede aos seus próprios recursos
- **CORS**: Configurável via `CORS_ALLOWED_ORIGINS`

---

## 🐳 Docker

### Build
```bash
docker build -t gardenaway-api .
```

### Run
```bash
docker compose up api
```

---

## 📝 Notas Importantes

1. **Telemetry e Connection Events** são **apenas leitura** pela API
   - Escritos pelo Consumer (Rust) via MQTT
   
2. **Setpoints** escrevem na BD **e** publicam no MQTT
   - ESP32 recebe os novos valores automaticamente

3. **Timestamps** são sempre retornados em **UTC** (ISO 8601)
   - Frontend deve converter para timezone do user

4. **Validações** acontecem no backend
   - Frontend deve validar também para melhor UX

---

## 🧪 Testes

### Testar health check
```bash
curl http://localhost:5000/health
```

### Registar user
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "display_name": "Test User",
    "timezone_id": 1
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Usar token
```bash
TOKEN="eyJ0eXAiOiJKV1Qi..."

curl http://localhost:5000/api/greenhouses \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📚 Dependências

- **Flask** 3.0.3 - Framework web
- **SQLAlchemy** 2.0.32 - ORM
- **psycopg2-binary** - Driver PostgreSQL
- **PyJWT** 2.8.0 - JSON Web Tokens
- **bcrypt** 4.1.2 - Password hashing
- **paho-mqtt** 2.0.0 - Cliente MQTT
- **flask-cors** - CORS support
- **python-dotenv** - Variáveis de ambiente

---

## 🆘 Troubleshooting

### API não inicia
- Verificar se `.env` existe na raiz do projeto
- Verificar se PostgreSQL está a correr: `docker compose ps`
- Ver logs: `docker compose logs api`

### Erro de conexão à BD
```bash
cd api
python test_db_connection.py
```

### Token inválido/expirado
- Tokens expiram em 30 dias
- Fazer login novamente para obter novo token

### MQTT não conecta
- Verificar se Mosquitto está a correr
- Ver logs: `docker compose logs mosquitto`
