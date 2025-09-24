const axios = require('axios');

const API_URL = 'http://localhost:3000';

async function testAPI() {
  console.log('🧪 Тестируем Periods API...\n');

  try {
    // Тест базового endpoint
    console.log('1. Тестируем базовый endpoint...');
    const testResponse = await axios.get(`${API_URL}/periods/test`);
    console.log('✅ Test endpoint работает:', testResponse.data);

    // Тест получения всех периодов
    console.log('\n2. Тестируем получение всех периодов...');
    const periodsResponse = await axios.get(`${API_URL}/periods`);
    console.log('✅ Periods endpoint работает. Найдено периодов:', periodsResponse.data.length);

    // Тест получения текущего периода
    console.log('\n3. Тестируем получение текущего периода...');
    const currentResponse = await axios.get(`${API_URL}/periods/current`);
    console.log('✅ Current period endpoint работает:', currentResponse.data ? 'Есть активный период' : 'Нет активного периода');

    console.log('\n🎉 Все API endpoints работают корректно!');
    
  } catch (error) {
    console.error('❌ Ошибка при тестировании API:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    console.log('\n💡 Убедитесь, что backend сервер запущен на порту 3000');
  }
}

testAPI();