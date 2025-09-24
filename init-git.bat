@echo off
echo Инициализация Git репозитория...
git init
echo.

echo Добавление файлов...
git add .
echo.

echo Создание первого коммита...
git commit -m "Initial commit: Sales Operations Management System

Features:
- 🏆 Leaderboard with progress tracking
- 🎖️ Grade management system  
- 👥 Participant management
- 📈 Performance visualization
- 📥 JSON data import
- 🔐 JWT authentication

Tech stack:
- Backend: NestJS + Prisma + SQLite
- Frontend: React + TypeScript + Vite + MUI

Note: Includes development database and config files for easy setup"
echo.

echo Переименование ветки в main...
git branch -M main
echo.

echo Добавление remote origin...
git remote add origin https://github.com/Makentosik/sales-op.git
echo.

echo Pushing to GitHub...
git push -u origin main
echo.

echo ✅ Git репозиторий успешно инициализирован и запушен!
pause