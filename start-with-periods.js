const { execSync } = require('child_process');

console.log('🚀 Запуск проекта с поддержкой периодов...\n');

try {
  console.log('📦 1. Обновляем базу данных...');
  process.chdir('./backend');
  
  execSync('npx prisma db push', { stdio: 'inherit' });
  console.log('✅ Схема базы данных обновлена\n');
  
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma клиент сгенерирован\n');
  
  console.log('🔧 2. Компилируем TypeScript...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Компиляция успешна\n');
  } catch (buildError) {
    console.log('⚠️  Предупреждение: Ошибка компиляции, но продолжаем...\n');
  }
  
  console.log('🎉 Готово! Теперь можно запустить проект:');
  console.log('');
  console.log('Backend: npm run start:dev (в папке backend)');
  console.log('Frontend: npm run dev (в папке frontend)');
  console.log('');
  console.log('Или используйте: npm run dev (в корне проекта)');
  console.log('');
  console.log('🔗 После запуска:');
  console.log('- Frontend: http://localhost:5173');
  console.log('- Backend: http://localhost:3000');
  console.log('- Периоды: http://localhost:5173/periods');
  console.log('');
  console.log('🧪 Для тестирования API запустите: node test-api.js');
  
} catch (error) {
  console.error('❌ Ошибка:', error.message);
  console.log('\n💡 Попробуйте выполнить команды вручную:');
  console.log('cd backend');
  console.log('npx prisma db push');
  console.log('npx prisma generate');
}