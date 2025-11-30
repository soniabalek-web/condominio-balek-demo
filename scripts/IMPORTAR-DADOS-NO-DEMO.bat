@echo off
chcp 65001 >nul
cls

echo ╔══════════════════════════════════════════════════════════╗
echo ║  📥 Importando dados para o banco DEMO                  ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

echo ⚠️  IMPORTANTE: Você precisa ter estas informações:
echo.
echo    1. Host do banco DEMO (ex: dpg-xxxxx.oregon-postgres.render.com)
echo    2. Senha do banco DEMO
echo    3. Arquivo SQL exportado (dados-para-demo-*.sql)
echo.
echo Essas informações estão no Render Dashboard, em "balek-demo-db"
echo.
pause
echo.

REM Solicitar informações
set /p DB_HOST="Digite o HOST do banco DEMO: "
echo.
set /p DB_PASSWORD="Digite a SENHA do banco DEMO: "
echo.

REM Listar arquivos .sql disponíveis
echo 📁 Arquivos SQL disponíveis:
echo.
dir /b dados-para-demo-*.sql 2>nul
if errorlevel 1 (
    echo    ❌ Nenhum arquivo encontrado!
    echo.
    echo    Execute primeiro: EXPORTAR-DADOS-PARA-DEMO.bat
    echo.
    pause
    exit /b 1
)
echo.

set /p ARQUIVO_SQL="Digite o nome do arquivo SQL (copie e cole): "
echo.

REM Verificar se o arquivo existe
if not exist "%ARQUIVO_SQL%" (
    echo ❌ ERRO: Arquivo não encontrado: %ARQUIVO_SQL%
    echo.
    pause
    exit /b 1
)

REM Configurações fixas do banco DEMO
set DB_USER=balek_demo_admin
set DB_NAME=residencial_balek_demo
set DB_PORT=5432

echo ═══════════════════════════════════════════════════════════
echo 📊 Configurações:
echo.
echo    Host: %DB_HOST%
echo    Banco: %DB_NAME%
echo    Usuário: %DB_USER%
echo    Arquivo: %ARQUIVO_SQL%
echo.
echo ═══════════════════════════════════════════════════════════
echo.

set /p CONFIRMA="Confirma a importação? (S/N): "
if /i not "%CONFIRMA%"=="S" (
    echo.
    echo ❌ Importação cancelada.
    pause
    exit /b 0
)

echo.
echo ⏳ Importando dados...
echo.

REM Verificar se psql está instalado
where psql >nul 2>&1
if errorlevel 1 (
    echo ❌ ERRO: psql não encontrado!
    echo.
    echo Para instalar o PostgreSQL client:
    echo 1. Baixe: https://www.postgresql.org/download/windows/
    echo 2. Instale apenas "Command Line Tools"
    echo 3. Execute este script novamente
    echo.
    pause
    exit /b 1
)

REM Definir senha como variável de ambiente
set PGPASSWORD=%DB_PASSWORD%

REM Importar dados
psql -h %DB_HOST% -U %DB_USER% -d %DB_NAME% -p %DB_PORT% -f %ARQUIVO_SQL%

if %errorlevel% equ 0 (
    echo.
    echo ✅ SUCESSO! Dados importados com sucesso!
    echo.
    echo ═══════════════════════════════════════════════════════════
    echo 🎯 PRÓXIMOS PASSOS:
    echo.
    echo 1. Acesse: https://demo.balek.de
    echo 2. Login: admin@residencialbalek.com
    echo 3. Senha: Demo@2025
    echo 4. Verifique se os dados estão lá!
    echo ═══════════════════════════════════════════════════════════
) else (
    echo.
    echo ❌ ERRO ao importar dados!
    echo.
    echo Verifique se:
    echo   - O host está correto
    echo   - A senha está correta
    echo   - Você tem conexão com a internet
    echo   - O banco de dados existe no Render
)

echo.
pause

REM Limpar senha
set PGPASSWORD=
set DB_PASSWORD=
