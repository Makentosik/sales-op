@echo off
echo Starting both Frontend and Backend servers...
echo.

REM Start Backend in a new window
echo Starting Backend server (NestJS)...
start "Backend Server" cmd /k "cd /d backend && npm run start:dev"

REM Wait a moment for backend to start
timeout /t 3 /nobreak > nul

REM Start Frontend in a new window
echo Starting Frontend server (Vite + React)...
start "Frontend Server" cmd /k "cd /d frontend && node node_modules/vite/bin/vite.js"

echo.
echo Both servers are starting...
echo Backend: http://localhost:3000
echo Frontend: http://localhost:5173
echo.
echo Press any key to continue or close this window...
pause > nul