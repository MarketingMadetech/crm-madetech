@echo off
echo ========================================
echo   CRM MADETECH - ACESSO REMOTO
echo ========================================
echo.

REM Inicia o backend
echo [1/3] Iniciando backend...
start "CRM Backend" cmd /k "cd /d "%~dp0backend" && npm start"

REM Aguarda 5 segundos
timeout /t 5 /nobreak >nul

REM Inicia o ngrok
echo [2/3] Criando tunel publico com ngrok...
start "Ngrok Tunnel" cmd /k "C:\ngrok\ngrok.exe http 3001"

REM Aguarda 3 segundos
timeout /t 3 /nobreak >nul

REM Inicia o frontend
echo [3/3] Iniciando frontend...
start "CRM Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ========================================
echo   TUDO PRONTO!
echo ========================================
echo.
echo Backend: http://localhost:3001
echo Frontend: http://localhost:5173
echo.
echo IMPORTANTE: Acesse o terminal do ngrok
echo para pegar o link publico que aparece!
echo.
echo Link sera algo como:
echo https://XXXX-XX-XXX-XXX-XX.ngrok-free.app
echo.
pause
