@echo off
chcp 65001 >nul
cls

echo ╔══════════════════════════════════════════════════════════╗
echo ║  📦 Exportando dados do banco REAL para o DEMO          ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

REM Configurações do banco REAL (produção)
set PGPASSWORD=WUqZGfZI1cSUD3J3Md1xMIDGXfHwXqkt
set DB_HOST=dpg-d4kqdu0dl3ps73fkj81g-a.oregon-postgres.render.com
set DB_USER=balek_admin
set DB_NAME=residencial_balek
set DB_PORT=5432

REM Nome do arquivo de backup
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c%%b%%a)
for /f "tokens=1-2 delims=/: " %%a in ('time /t') do (set mytime=%%a%%b)
set BACKUP_FILE=dados-para-demo-%mydate%-%mytime%.sql

echo 📊 Conectando ao banco de produção...
echo    Host: %DB_HOST%
echo    Database: %DB_NAME%
echo.

echo ⏳ Exportando dados...
echo.

REM Verificar se pg_dump está instalado
where pg_dump >nul 2>&1
if errorlevel 1 (
    echo ❌ ERRO: pg_dump não encontrado!
    echo.
    echo Para instalar o PostgreSQL client:
    echo 1. Baixe: https://www.postgresql.org/download/windows/
    echo 2. Instale apenas "Command Line Tools"
    echo 3. Execute este script novamente
    echo.
    pause
    exit /b 1
)

REM Exportar APENAS os dados
pg_dump -h %DB_HOST% -U %DB_USER% -d %DB_NAME% -p %DB_PORT% --data-only --no-owner --no-acl -f %BACKUP_FILE%

if %errorlevel% equ 0 (
    echo.
    echo ✅ SUCESSO! Dados exportados com sucesso!
    echo.
    echo 📁 Arquivo criado: %BACKUP_FILE%
    echo.
    echo ═══════════════════════════════════════════════════════════
    echo 🎯 PRÓXIMOS PASSOS:
    echo.
    echo 1. Guarde este arquivo em local seguro
    echo 2. Você usará ele para popular o banco DEMO
    echo 3. Siga o guia: GUIA-DEPLOY-DEMO.md
    echo ═══════════════════════════════════════════════════════════
) else (
    echo.
    echo ❌ ERRO ao exportar dados!
    echo Verifique se:
    echo   - Você tem pg_dump instalado
    echo   - As credenciais estão corretas
    echo   - Você tem conexão com a internet
)

echo.
pause

REM Limpar senha
set PGPASSWORD=
