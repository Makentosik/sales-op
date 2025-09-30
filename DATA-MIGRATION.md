# 📦 Миграция данных SQLite → PostgreSQL

## 🎯 Цель
Экспорт всех данных из SQLite (локальная разработка) и импорт в PostgreSQL (продакшен на Vercel).

## 📋 Что сохраняется
- ✅ **Пользователи** (admin, test users)
- ✅ **Грейды** (все настроенные уровни с цветами)
- ✅ **Участники** (менеджеры с их данными)
- ✅ **Периоды** (активные и завершенные)
- ✅ **Платежи** (история выплат)
- ✅ **Логи** (история операций)
- ✅ **Переходы грейдов** (история изменений)

## 🔄 Процесс миграции

### Шаг 1: Экспорт данных из SQLite

```bash
# Переходим в папку backend
cd backend

# Экспортируем все данные
npm run export-data
```

**Результат:**
- `exports/data-export-YYYY-MM-DD.json` - полный экспорт
- `exports/essential-data-export-YYYY-MM-DD.json` - только критичные данные

### Шаг 2: Подготовка к продакшену

1. **Переключаем схему Prisma на PostgreSQL:**
   ```bash
   cd backend
   cp prisma/schema.production.prisma prisma/schema.prisma
   npx prisma generate
   ```

2. **Создаем PostgreSQL базу данных:**
   - Vercel Postgres (рекомендуется)
   - Supabase
   - Railway
   - Neon

3. **Получаем DATABASE_URL** в формате:
   ```
   postgresql://user:password@host:port/database
   ```

### Шаг 3: Развертывание на Vercel

1. **Настраиваем переменные окружения в Vercel:**
   ```bash
   DATABASE_URL=postgresql://your-database-url-here
   JWT_SECRET=your-super-secure-jwt-secret
   JWT_EXPIRES_IN=24h
   NODE_ENV=production
   ```

2. **Разворачиваем проект:**
   ```bash
   # Через CLI
   vercel --prod
   
   # Или через GitHub integration
   git add .
   git commit -m "Ready for production"
   git push origin main
   ```

### Шаг 4: Импорт данных в продакшен

```bash
# Подключаемся к продакшен базе
DATABASE_URL="postgresql://your-url" npm run import-data:force

# Или импорт конкретного файла
DATABASE_URL="postgresql://your-url" node scripts/import-data.js data-export-2025-09-30.json --force-clear
```

## 🗂️ Структура экспорта

```json
{
  "metadata": {
    "exportDate": "2025-09-30T08:00:00.000Z",
    "source": "SQLite",
    "version": "1.0"
  },
  "data": {
    "users": [...],        // Пользователи системы
    "grades": [...],       // Грейды с настройками
    "participants": [...], // Менеджеры
    "periods": [...],      // Периоды
    "payments": [...],     // Платежи
    "logs": [...],         // Логи
    "gradeTransitions": [...] // Переходы грейдов
  },
  "statistics": {
    "users": 2,
    "grades": 6,
    "participants": 3,
    "periods": 1
  }
}
```

## 🛡️ Безопасность

- **Пароли пользователей** сохраняются в зашифрованном виде (bcrypt)
- **JWT секреты** не экспортируются (настраиваются отдельно)
- **Файлы экспорта** добавлены в .gitignore

## ⚠️ Важные моменты

1. **Флаг --force-clear** полностью очищает целевую БД перед импортом
2. **ID записей** сохраняются (UUID)
3. **Связи между таблицами** восстанавливаются автоматически
4. **Временные метки** сохраняются

## 🔄 Обратная миграция

Если нужно вернуться к SQLite:

```bash
# Возвращаем SQLite схему
cp prisma/schema.prisma.backup prisma/schema.prisma

# Или заново создаем данные
npx prisma db seed
```

## 📁 Файлы миграции

- `backend/scripts/export-data.js` - экспорт из SQLite
- `backend/scripts/import-data.js` - импорт в PostgreSQL
- `backend/exports/` - папка с экспортированными данными
- `backend/prisma/schema.production.prisma` - схема для PostgreSQL

## 🧪 Тестирование миграции

После импорта проверьте:
1. ✅ Логин работает (admin@test.com / admin123)
2. ✅ Грейды отображаются с правильными цветами
3. ✅ Участники имеют корректные данные
4. ✅ Расчет зарплат работает
5. ✅ Периоды функционируют

## 📞 Поддержка

При ошибках миграции:
1. Проверьте логи в консоли
2. Убедитесь в корректности DATABASE_URL
3. Проверьте доступ к PostgreSQL
4. Убедитесь, что схема Prisma соответствует целевой БД