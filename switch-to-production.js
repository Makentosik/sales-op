const fs = require('fs');
const path = require('path');

console.log('🔄 Переключение на production конфигурацию...');

// Переключаем schema.prisma на production версию
const backendDir = path.join(__dirname, 'backend');
const prismaDir = path.join(backendDir, 'prisma');

const devSchema = path.join(prismaDir, 'schema.prisma');
const prodSchema = path.join(prismaDir, 'schema.production.prisma');
const devBackup = path.join(prismaDir, 'schema.development.prisma');

try {
  // Создаем backup текущей dev схемы
  if (fs.existsSync(devSchema)) {
    fs.copyFileSync(devSchema, devBackup);
    console.log('✅ Создан backup dev схемы');
  }

  // Копируем production схему
  if (fs.existsSync(prodSchema)) {
    fs.copyFileSync(prodSchema, devSchema);
    console.log('✅ Установлена production схема');
  }

  // Переключаем .env файл
  const devEnv = path.join(backendDir, '.env');
  const prodEnv = path.join(backendDir, '.env.production');
  const envBackup = path.join(backendDir, '.env.development');

  if (fs.existsSync(devEnv)) {
    fs.copyFileSync(devEnv, envBackup);
    console.log('✅ Создан backup dev .env');
  }

  if (fs.existsSync(prodEnv)) {
    fs.copyFileSync(prodEnv, devEnv);
    console.log('✅ Установлен production .env');
  }

  console.log('\n🎯 Следующие шаги:');
  console.log('1. Настройте DATABASE_URL в Vercel environment variables');
  console.log('2. Настройте JWT_SECRET в Vercel environment variables');
  console.log('3. Запустите: npx prisma generate');
  console.log('4. Деплойте на Vercel');

} catch (error) {
  console.error('❌ Ошибка при переключении конфигурации:', error.message);
}