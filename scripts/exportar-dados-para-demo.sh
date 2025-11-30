#!/bin/bash

# ==========================================
# SCRIPT PARA EXPORTAR DADOS DO BANCO REAL
# Para importar no ambiente DEMO
# ==========================================

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  📦 Exportando dados do banco REAL para o DEMO          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Configurações do banco REAL (produção)
export PGPASSWORD='WUqZGfZI1cSUD3J3Md1xMIDGXfHwXqkt'
DB_HOST='dpg-d4kqdu0dl3ps73fkj81g-a.oregon-postgres.render.com'
DB_USER='balek_admin'
DB_NAME='residencial_balek'
DB_PORT='5432'

# Nome do arquivo de backup
BACKUP_FILE="dados-para-demo-$(date +%Y%m%d-%H%M%S).sql"

echo "📊 Conectando ao banco de produção..."
echo "   Host: $DB_HOST"
echo "   Database: $DB_NAME"
echo ""

# Exportar APENAS os dados (sem estrutura, pois ela será criada automaticamente)
echo "⏳ Exportando dados..."
pg_dump -h "$DB_HOST" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        -p "$DB_PORT" \
        --data-only \
        --no-owner \
        --no-acl \
        -f "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SUCESSO! Dados exportados com sucesso!"
    echo ""
    echo "📁 Arquivo criado: $BACKUP_FILE"
    echo "📏 Tamanho: $(ls -lh "$BACKUP_FILE" | awk '{print $5}')"
    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo "🎯 PRÓXIMOS PASSOS:"
    echo ""
    echo "1. Guarde este arquivo em local seguro"
    echo "2. Você usará ele para popular o banco DEMO"
    echo "3. Siga o guia: GUIA-DEPLOY-DEMO.md"
    echo "═══════════════════════════════════════════════════════════"
else
    echo ""
    echo "❌ ERRO ao exportar dados!"
    echo "Verifique se:"
    echo "  - Você tem pg_dump instalado"
    echo "  - As credenciais estão corretas"
    echo "  - Você tem conexão com a internet"
fi

# Limpar senha do ambiente
unset PGPASSWORD
