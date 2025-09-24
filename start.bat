@echo off
echo 🚀 Запуск Payment System...
echo.

REM Проверяем, существует ли база данных
if not exist "backend\prisma\dev.db" (
    echo 📊 Первый запуск - настройка базы данных...
    cd backend
    call npx prisma generate
    call npx prisma db push
    call npx prisma db seed
    cd ..
    echo ✅ База данных настроена!
    echo.
)

echo 🔧 Запускаем приложение...
echo.
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:3000
echo.
echo 📝 Тестовые данные:
echo Админ:  admin@test.com / admin123
echo Юзер:   user@test.com  / user123
echo.

REM Запускаем оба сервера параллельно
start "Backend" cmd /k "cd backend && npm run start:dev"
timeout /t 3 >nul
start "Frontend" cmd /k "cd frontend && npm run dev"

echo 🎉 Приложение запущено!
echo Откройте http://localhost:5173 в браузере
pause