const { execSync } = require('child_process');

console.log('🔄 Обновление Prisma...');

try {
  process.chdir('./backend');
  
  console.log('📦 Применяем изменения схемы...');
  execSync('npx prisma db push', { stdio: 'inherit' });
  
  console.log('🔧 Генерируем Prisma клиент...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  console.log('✅ Prisma успешно обновлена!');
} catch (error) {
  console.error('❌ Ошибка при обновлении Prisma:', error.message);
}