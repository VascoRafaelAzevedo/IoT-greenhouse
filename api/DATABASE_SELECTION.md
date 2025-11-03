# Database Selection Guide

A API suporta dois modos de base de dados para facilitar o desenvolvimento e testes.

## 📚 Bases de Dados Disponíveis

### 1. **Production Database** (`greenhouse`)
- Base de dados principal com dados seed
- Usada por padrão quando `USE_TEST_DB` não está definida
- Contém:
  - Timezones pré-populadas
  - Templates de plantas
  - Dados de exemplo (1 utilizador, 1 estufa, telemetria)

### 2. **Test Database** (`greenhouse_test`)
- Base de dados limpa SEM dados seed
- Ideal para testes sem afetar dados de produção
- Apenas schema, sem dados pré-populados
- Ativa quando `USE_TEST_DB=true`

## 🔧 Como Escolher a Base de Dados

### Método 1: Variável de Ambiente (Recomendado)

```bash
# Usar base de dados de TESTE
export USE_TEST_DB=true
python -m src.app

# Usar base de dados de PRODUÇÃO (padrão)
unset USE_TEST_DB
python -m src.app
# ou explicitamente:
export USE_TEST_DB=false
python -m src.app
```

### Método 2: Script Helper

```bash
# Usar o script que já define USE_TEST_DB=true
cd api
./test_with_testdb.sh
```

### Método 3: Inline (Uma única execução)

```bash
# Executar uma vez com DB de teste
USE_TEST_DB=true python -m src.app

# Executar uma vez com DB de produção
USE_TEST_DB=false python -m src.app
```

## ✅ Verificar Qual Base de Dados Está Ativa

Use o endpoint `/health` para confirmar:

```bash
curl http://localhost:5000/health | jq
```

**Resposta esperada:**

```json
{
  "status": "ok",
  "environment": "development",
  "database": "ok",
  "current_db": "greenhouse_test",      // nome real da DB conectada
  "using_test_db": true                 // flag USE_TEST_DB
}
```

### Exemplos de Resposta

**Modo Produção:**
```json
{
  "current_db": "greenhouse",
  "using_test_db": false
}
```

**Modo Teste:**
```json
{
  "current_db": "greenhouse_test",
  "using_test_db": true
}
```

## 🧪 Workflow de Teste Recomendado

### 1. Desenvolvimento com Dados Limpos

```bash
# Terminal 1: API com DB de teste
export USE_TEST_DB=true
python -m src.app

# Terminal 2: Testar endpoints
curl http://localhost:5000/health | jq .current_db
# Saída: "greenhouse_test"

# Registar utilizador de teste
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "display_name": "Test User",
    "timezone_id": 1
  }'
```

### 2. Verificar Funcionalidades com Dados Seed

```bash
# Terminal 1: API com DB de produção
unset USE_TEST_DB
python -m src.app

# Terminal 2: Usar credenciais do seed
curl http://localhost:5000/health | jq .current_db
# Saída: "greenhouse"

# Login com utilizador seed
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@greenhouse.com",
    "password": "admin123"
  }'
```

## 🔍 Configuração no .env

Certifica-te que o ficheiro `.env` tem ambas as variáveis:

```properties
DB_NAME=greenhouse              # Base de dados de produção
DB_NAME_TEST=greenhouse_test    # Base de dados de teste
```

**Nota:** A API escolhe automaticamente entre `DB_NAME` e `DB_NAME_TEST` com base no valor de `USE_TEST_DB`.

## 🐳 Docker Compose

Ambas as bases de dados são criadas automaticamente quando inicias o container PostgreSQL:

```bash
docker-compose up -d postgres
```

O script `database/init/00-create-databases.sql` cria ambas as databases:
- `greenhouse` - com seed data (via `02-seed-data.sql`)
- `greenhouse_test` - apenas schema (sem seed)

## 💡 Dicas

1. **Sempre verifica** qual DB está ativa antes de fazer mudanças:
   ```bash
   curl -s http://localhost:5000/health | jq '.current_db, .using_test_db'
   ```

2. **Logs da aplicação** também mostram a DB conectada no startup

3. **Resetar DB de teste** (se necessário):
   ```bash
   docker-compose exec postgres psql -U postgres -c "DROP DATABASE greenhouse_test;"
   docker-compose exec postgres psql -U postgres -c "CREATE DATABASE greenhouse_test;"
   docker-compose exec postgres psql -U postgres -d greenhouse_test -f /docker-entrypoint-initdb.d/01-schema.sql
   ```

4. **Para CI/CD**, define `USE_TEST_DB=true` no pipeline para não afetar produção

## 🚨 Cuidados

- ⚠️ **Nunca** usar `USE_TEST_DB=true` em produção
- ⚠️ A DB de teste **não tem dados seed** - tens de criar utilizadores, estufas, etc.
- ⚠️ Ambas as DBs partilham o mesmo PostgreSQL container mas são **completamente isoladas**

## 📊 Diferenças entre as Databases

| Feature | `greenhouse` (Prod) | `greenhouse_test` |
|---------|-------------------|-------------------|
| Schema | ✅ | ✅ |
| Timezones | ✅ 400+ entries | ❌ Vazio |
| Plant Templates | ✅ 3 templates | ❌ Vazio |
| Seed User | ✅ admin@greenhouse.com | ❌ Nenhum |
| Seed Greenhouse | ✅ "My Greenhouse" | ❌ Nenhum |
| Telemetria Exemplo | ✅ 1 entrada | ❌ Nenhum |
| Connection Events | ✅ 2 eventos | ❌ Nenhum |

---

**Pronto!** Agora podes alternar facilmente entre bases de dados com `USE_TEST_DB=true/false` 🎉
