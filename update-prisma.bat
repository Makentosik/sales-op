@echo off
echo Обновление Prisma...
cd backend
echo.

echo Применяем изменения схемы к базе данных...
npx prisma db push
echo.

echo Генерируем Prisma клиент...
npx prisma generate
echo.

echo ✅ Prisma обновлена!
pause