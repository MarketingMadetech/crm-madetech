@echo off
echo 🚀 Iniciando CRM Madetech...
echo.

REM Abre o backend em uma nova janela
start "CRM Backend" cmd /k "cd /d "%~dp0backend" && npm start"

REM Aguarda 3 segundos
timeout /t 3 /nobreak >nul

REM Abre o frontend em outra janela com host para compartilhamento
start "CRM Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev -- --host"

echo.
echo ✅ Backend e Frontend iniciados!
echo 📱 Backend rodando em: http://localhost:3001
echo 🌐 Frontend rodando em: http://localhost:5173
echo.
pause
