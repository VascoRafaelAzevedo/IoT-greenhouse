#!/bin/bash
# Script de inicialização completo para o ambiente de desenvolvimento

set -e  # Exit on error

echo "🚀 IoT Greenhouse - Setup Completo"
echo "=================================="
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Diretório raiz do projeto
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

echo -e "${YELLOW}1. Verificando Docker...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker não está instalado${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker encontrado${NC}"

echo ""
echo -e "${YELLOW}2. Inicializando base de dados...${NC}"
docker compose up postgres -d

echo "   Aguardando base de dados inicializar..."
sleep 5

# Verificar se a base de dados está pronta
MAX_RETRIES=30
RETRY=0
until docker compose exec -T postgres pg_isready -U postgres &> /dev/null; do
    RETRY=$((RETRY+1))
    if [ $RETRY -gt $MAX_RETRIES ]; then
        echo -e "${RED}✗ Timeout aguardando base de dados${NC}"
        exit 1
    fi
    echo "   Tentativa $RETRY/$MAX_RETRIES..."
    sleep 1
done

echo -e "${GREEN}✓ Base de dados inicializada${NC}"

echo ""
echo -e "${YELLOW}3. Verificando ambiente virtual Python...${NC}"
if [ ! -d ".venv" ]; then
    echo -e "${RED}✗ Ambiente virtual não encontrado${NC}"
    echo "   Execute: python3 -m venv .venv"
    exit 1
fi
echo -e "${GREEN}✓ Ambiente virtual encontrado${NC}"

echo ""
echo -e "${YELLOW}4. Ativando ambiente virtual...${NC}"
source .venv/bin/activate
echo -e "${GREEN}✓ Ambiente virtual ativado${NC}"

echo ""
echo -e "${YELLOW}5. Verificando dependências...${NC}"
cd api
pip install -q -r requirements.txt
echo -e "${GREEN}✓ Dependências instaladas${NC}"

echo ""
echo -e "${YELLOW}6. Testando conexão à base de dados...${NC}"
python test_db_connection.py

echo ""
echo -e "${GREEN}=================================="
echo "✓ Setup completo!"
echo "==================================${NC}"
echo ""
echo "Para iniciar a API:"
echo "  cd api"
echo "  python test_api.py"
echo ""
echo "A API estará disponível em: http://localhost:5000"
echo ""
echo "Endpoints disponíveis:"
echo "  GET  /health"
echo "  GET  /api/users"
echo "  GET  /api/greenhouses"
echo "  GET  /api/plants"
echo "  GET  /api/timezones"
echo ""
echo "Ver documentação completa em: api/README.md"
