# 🚀 Развертывание на Vercel

## 📋 Предварительные требования

### 1. **База данных PostgreSQL**
- Создайте PostgreSQL базу данных (рекомендуется Vercel Postgres, Supabase или Railway)
- Получите `DATABASE_URL` в формате: `postgresql://user:password@host:port/database`

### 2. **Настройка переменных окружения в Vercel**
В настройках проекта Vercel добавьте:

```bash
DATABASE_URL=postgresql://your-database-url-here
JWT_SECRET=your-super-secure-jwt-secret-key
JWT_EXPIRES_IN=24h
NODE_ENV=production
```

## 🔄 Пошаговое развертывание

### Шаг 1: Подготовка к развертыванию

1. **Переключение на PostgreSQL для продакшена:**
   ```bash
   # В папке backend замените schema.prisma на production версию
   cp prisma/schema.production.prisma prisma/schema.prisma
   ```

2. **Генерация Prisma client:**
   ```bash
   cd backend
   npx prisma generate
   ```

### Шаг 2: Развертывание на Vercel

#### Вариант A: Через Vercel CLI
```bash
# Установите Vercel CLI
npm i -g vercel

# Войдите в аккаунт
vercel login

# Разверните проект
vercel --prod
```

#### Вариант B: Через GitHub
1. Создайте репозиторий на GitHub
2. Загрузите код:
   ```bash
   git add .
   git commit -m "Ready for Vercel deployment"
   git push origin main
   ```
3. Подключите репозиторий в Vercel Dashboard

### Шаг 3: Настройка базы данных в продакшене

После развертывания выполните миграции:

```bash
# Подключитесь к продакшен базе данных
vercel env pull .env.production

# Выполните миграции
cd backend
DATABASE_URL="ваш-production-database-url" npx prisma db push

# Заполните начальными данными
DATABASE_URL="ваш-production-database-url" npx prisma db seed
```

## ⚙️ Структура проекта для Vercel

```
new-op/
├── frontend/          # React приложение
├── backend/          # NestJS API
├── vercel.json      # Конфигурация Vercel
└── .vercelignore    # Файлы для исключения
```

## 🔧 Настройки

### `vercel.json` - конфигурация:
- **Frontend**: статический билд из `frontend/dist`
- **Backend**: serverless функция из `backend/src/main.ts`
- **Routes**: API запросы перенаправляются на backend

### Рекомендуемые провайдеры баз данных:
1. **Vercel Postgres** - интеграция с Vercel
2. **Supabase** - бесплатный PostgreSQL
3. **Railway** - простое развертывание
4. **Neon** - serverless PostgreSQL

## ⚠️ Важные моменты

1. **SQLite не поддерживается** на Vercel
2. **Переменные окружения** должны быть настроены в Vercel Dashboard
3. **Файлы базы данных** исключены через `.vercelignore`
4. **CORS** настроен для работы с Vercel доменами

## 🌐 После развертывания

Ваше приложение будет доступно по адресу:
- Frontend: `https://your-app-name.vercel.app`
- API: `https://your-app-name.vercel.app/api/*`

## 🐛 Отладка

Если что-то не работает:
1. Проверьте логи в Vercel Dashboard
2. Убедитесь, что переменные окружения настроены
3. Проверьте подключение к базе данных
4. Выполните миграции Prisma

## 📝 Тестовые данные

После развертывания создайте тестовые аккаунты:
- **Админ**: admin@test.com / admin123
- **Пользователь**: user@test.com / user123