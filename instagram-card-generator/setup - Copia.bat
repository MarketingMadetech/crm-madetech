@echo off
REM Script de setup para Windows PowerShell
echo.
echo ====================================
echo Instagram Card Generator - Setup
echo ====================================
echo.

REM Criar ambiente virtual
echo [1/4] Criando ambiente virtual...
python -m venv venv
if %errorlevel% neq 0 (
    echo Erro ao criar ambiente virtual!
    exit /b 1
)

REM Ativar ambiente virtual
echo [2/4] Ativando ambiente virtual...
call venv\Scripts\activate.bat

REM Instalar dependências
echo [3/4] Instalando dependências...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo Erro ao instalar dependências!
    exit /b 1
)

REM Criar arquivo .env
echo [4/4] Configurando arquivo .env...
if not exist .env (
    copy .env.example .env
    echo Arquivo .env criado. Por favor, adicione sua API key!
) else (
    echo Arquivo .env ja existe.
)

echo.
echo ====================================
echo ✅ Setup concluído com sucesso!
echo ====================================
echo.
echo Próximos passos:
echo 1. Edite o arquivo .env com sua API key
echo 2. Execute: python main.py
echo.
pause
