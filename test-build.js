const { execSync } = require('child_process');

console.log('🔍 Проверяем компиляцию backend...');

try {
  process.chdir('./backend');
  
  console.log('📦 Обновляем Prisma...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  console.log('🔧 Компилируем TypeScript...');
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log('✅ Компиляция прошла успешно!');
} catch (error) {
  console.error('❌ Ошибка компиляции:', error.message);
  console.log('\n💡 Попробуйте исправить ошибки и запустить заново');
}