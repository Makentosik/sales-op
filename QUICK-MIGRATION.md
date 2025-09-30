# 🚀 Быстрая миграция на Vercel

## ✅ Данные экспортированы!

Ваши данные успешно сохранены в файлы:
- `backend/exports/data-export-2025-09-30.json` (полный экспорт)
- `backend/exports/essential-data-export-2025-09-30.json` (критичные данные)

**📊 Что сохранено:**
- 👥 2 пользователя (admin@test.com, user@test.com)
- 🎖️ 6 грейдов с настройками и цветами
- 👤 3 участника (менеджеры)
- 📅 1 активный период
- 💰 3 платежа

## 🏃‍♂️ Быстрое развертывание:

### 1. Создайте PostgreSQL БД
**Рекомендуется Supabase** (бесплатно):
1. Идите на [supabase.com](https://supabase.com)
2. Создайте новый проект
3. Скопируйте DATABASE_URL из Settings → Database

### 2. Разверните на Vercel
```bash
# Установите Vercel CLI
npm i -g vercel

# Войдите в аккаунт
vercel login

# Разверните проект
vercel --prod
```

### 3. Настройте переменные в Vercel Dashboard
```
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
JWT_SECRET=your-super-secure-secret-key
JWT_EXPIRES_IN=24h
NODE_ENV=production
```

### 4. Импортируйте данные
```bash
# Переключите схему на PostgreSQL
cd backend
cp prisma/schema.production.prisma prisma/schema.prisma

# Импортируйте данные в продакшен
DATABASE_URL="ваш-database-url" npm run import-data:force
```

## ⚡ Готово!
Ваше приложение будет доступно на `https://your-app.vercel.app`

**Тестовые аккаунты:**
- Админ: `admin@test.com` / `admin123`
- Пользователь: `user@test.com` / `user123`

---

📖 Подробная инструкция: `VERCEL-DEPLOYMENT.md`
🔄 Миграция данных: `DATA-MIGRATION.md`