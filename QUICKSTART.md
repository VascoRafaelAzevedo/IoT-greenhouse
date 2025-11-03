# 🚀 Quick Start - IoT Greenhouse API

## 📋 Setup Completo

### 1. Ambiente Virtual Python ✅
O ambiente virtual já está configurado em `.venv/` na raiz do projeto.

### 2. Ativar Ambiente Virtual
```bash
cd /home/vasco-debian/Desktop/DEV/Versioned/College/IoT-greenhouse
source .venv/bin/activate
```

### 3. Variáveis de Ambiente
As variáveis de ambiente estão no ficheiro `.env` na raiz do projeto.

Principais configurações:
- **Database**: localhost:5432, greenhouse
- **JWT**: Tokens expiram em 30 dias
- **MQTT**: localhost:1883
- **CORS**: * (todas as origens)

### 4. Iniciar Base de Dados
```bash
docker compose up postgres -d
```

### 5. Testar Conexão à Base de Dados
```bash
cd api
python test_db_connection.py
```

### 6. Iniciar API
```bash
cd api
python test_api.py
```

A API estará disponível em: **http://localhost:5000**

---

## 🧪 Testar API

### Health Check
```bash
curl http://localhost:5000/health
```

### Registar User
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
  -d '{"email": "test@example.com", "password": "password123"}'
```

### Usar Token (guardar o token do login/register)
```bash
TOKEN="<seu-token-aqui>"

# Ver perfil
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"

# Listar greenhouses
curl http://localhost:5000/api/greenhouses \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📁 Nova Estrutura

### API Core
```
api/
├── src/                      # ✨ NOVO: Código fonte organizado
│   ├── app.py               # Aplicação Flask
│   ├── models.py            # Modelos SQLAlchemy
│   ├── database.py          # Configuração BD
│   ├── auth.py              # ✨ NOVO: JWT auth
│   ├── mqtt_client.py       # ✨ NOVO: Cliente MQTT
│   ├── validators.py        # ✨ NOVO: Validações
│   ├── utils.py             # Utilitários
│   └── routes/              # ✨ NOVO: Rotas organizadas
│       ├── auth.py          # Autenticação
│       ├── greenhouses.py   # Greenhouses CRUD
│       ├── setpoints.py     # Setpoints
│       ├── telemetry.py     # Telemetria (read-only)
│       ├── connections.py   # Connection events (read-only)
│       ├── plants.py        # Plants (read-only)
│       └── timezones.py     # Timezones
├── requirements.txt
├── Dockerfile
├── wsgi.py
├── test_api.py
└── test_db_connection.py
```

### ⚠️ Mudanças Importantes
- ✅ Ficheiros `.env` removidos da pasta `api/` (usam o da raiz)
- ✅ Código movido para `api/src/`
- ✅ Adicionada autenticação JWT completa
- ✅ Integração MQTT para setpoints
- ✅ Validações de input
- ✅ Permissões por user (cada user só vê os seus dados)
- ✅ Telemetry e Connection Events são **read-only** (escritos pelo Rust Consumer)
- ✅ Removido `target_hum_air_min` (base de dados só tem `max`)

---

## 🎯 Endpoints Disponíveis

### 🔓 Públicos (sem autenticação)
- `GET /health` - Health check
- `POST /api/auth/register` - Registar
- `POST /api/auth/login` - Login
- `GET /api/timezones` - Listar timezones

### 🔐 Autenticados (requerem token)

#### Perfil
- `GET /api/auth/me` - Ver perfil
- `PUT /api/auth/me` - Atualizar display_name, timezone
- `DELETE /api/auth/me` - Apagar conta

#### Greenhouses
- `GET /api/greenhouses` - Listar minhas greenhouses
- `POST /api/greenhouses` - Criar greenhouse
- `GET /api/greenhouses/<id>` - Ver greenhouse
- `PUT /api/greenhouses/<id>` - Atualizar nome
- `DELETE /api/greenhouses/<id>` - Apagar

#### Setpoints
- `GET /api/greenhouses/<id>/setpoint` - Ver setpoint
- `PUT /api/greenhouses/<id>/setpoint` - Atualizar (publica MQTT)

#### Telemetry (Read-Only)
- `GET /api/greenhouses/<id>/telemetry?days=7&limit=1000`
- `GET /api/greenhouses/<id>/telemetry/latest`

#### Connections (Read-Only)
- `GET /api/greenhouses/<id>/connections?limit=50`

#### Plants (Read-Only)
- `GET /api/plants` - Listar templates
- `GET /api/plants/<id>` - Ver planta

---

## 🔗 Integração MQTT

Quando atualizas um setpoint via API:
1. ✅ Guarda na base de dados
2. ✅ Publica no MQTT → `greenhouse/{id}/setpoints`
3. ✅ ESP32 recebe e atualiza parâmetros

---

## 🔒 Autenticação JWT

- **Tokens expiram em 30 dias**
- **Header**: `Authorization: Bearer <token>`
- **Cada user só vê os seus dados**

---

## � Validações

### Setpoint (todos os campos obrigatórios)
- `target_temp_min`: 0-40°C
- `target_temp_max`: 0-50°C (> min)
- `target_hum_air_max`: 0-100%
- `irrigation_interval_minutes`: 1-1440
- `irrigation_duration_seconds`: 1-600
- `target_light_intensity`: 0-100000 lux

### User Registration
- Email válido
- Password min 8 caracteres
- Display name obrigatório
- Timezone obrigatório

---

## 🆘 Troubleshooting

### API não inicia
```bash
# Verificar se BD está a correr
docker compose ps

# Ver logs
docker compose logs api

# Testar conexão BD
cd api && python test_db_connection.py
```

### Token inválido
- Fazer login novamente para obter novo token
- Verificar se o header está correto: `Authorization: Bearer <token>`

### MQTT não conecta
```bash
# Verificar Mosquitto
docker compose ps
docker compose logs mosquitto
```

---

## 📚 Documentação Completa

Ver `api/README.md` para documentação detalhada de todos os endpoints.
5. **Documentação OpenAPI** - Gerar documentação Swagger

## 💡 Dicas

- Use `serialize_model()` para converter modelos SQLAlchemy em JSON
- Use `db_session` para fazer queries à base de dados
- Todos os erros de DB retornam status 500 com mensagem de erro
- Timestamps são automáticos (created_at, changed_at, etc.)

## 🐛 Debug

Se tiver problemas:

1. Verificar se a base de dados está a correr: `docker ps`
2. Testar conexão: `python test_db_connection.py`
3. Ver logs da API: o servidor mostra logs em tempo real
4. Ver logs da BD: `docker-compose logs postgres`
