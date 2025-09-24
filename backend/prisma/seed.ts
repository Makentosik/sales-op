import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Удаляем существующие данные
  await prisma.payment.deleteMany();
  await prisma.periodGrade.deleteMany();
  await prisma.log.deleteMany();
  await prisma.participant.deleteMany();
  await prisma.period.deleteMany();
  await prisma.grade.deleteMany();
  await prisma.user.deleteMany();

  // Создаем тестового администратора
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@test.com',
      password: adminPassword,
      name: 'Администратор',
      role: 'ADMIN',
    },
  });

  console.log('✅ Created admin user:', {
    email: admin.email,
    password: 'admin123', // показываем пароль только для демо
    name: admin.name,
  });

  // Создаем тестового пользователя
  const userPassword = await bcrypt.hash('user123', 10);
  const user = await prisma.user.create({
    data: {
      email: 'user@test.com',
      password: userPassword,
      name: 'Тестовый Пользователь',
      role: 'USER',
    },
  });

  console.log('✅ Created test user:', {
    email: user.email,
    password: 'user123', // показываем пароль только для демо
    name: user.name,
  });

  // Создаем грейды согласно требованиям (от 1млн до 3.4млн с шагом 400к)
  const grades = await Promise.all([
    prisma.grade.create({
      data: {
        name: 'Новичок',
        description: 'Начальный уровень продаж',
        plan: 1260000,
        minRevenue: 1000000,
        maxRevenue: 1399999,
        performanceLevels: [
          { completionPercentage: 50, requiredRevenue: 630000, bonusPercentage: 2.57, bonus: 16200, salary: 15000, totalSalary: 31200 },
          { completionPercentage: 75, requiredRevenue: 945000, bonusPercentage: 3.86, bonus: 36450, salary: 15000, totalSalary: 51450 },
          { completionPercentage: 100, requiredRevenue: 1260000, bonusPercentage: 5.14, bonus: 64800, salary: 15000, totalSalary: 79800 },
          { completionPercentage: 110, requiredRevenue: 1386000, bonusPercentage: 5.65, bonus: 78300, salary: 15000, totalSalary: 93300 },
          { completionPercentage: 120, requiredRevenue: 1512000, bonusPercentage: 6.17, bonus: 93240, salary: 15000, totalSalary: 108240 },
          { completionPercentage: 130, requiredRevenue: 1638000, bonusPercentage: 6.68, bonus: 109368, salary: 15000, totalSalary: 124368 }
        ],
        color: '#27ae60',
        order: 1,
      },
    }),
    prisma.grade.create({
      data: {
        name: 'Специалист',
        description: 'Опытный продавец',
        plan: 1440000,
        minRevenue: 1400000,
        maxRevenue: 1799999,
        performanceLevels: [
          { completionPercentage: 50, requiredRevenue: 720000, bonusPercentage: 2.82, bonus: 20304, salary: 21000, totalSalary: 41304 },
          { completionPercentage: 75, requiredRevenue: 1080000, bonusPercentage: 4.22, bonus: 45576, salary: 21000, totalSalary: 66576 },
          { completionPercentage: 100, requiredRevenue: 1440000, bonusPercentage: 5.63, bonus: 81072, salary: 21000, totalSalary: 102072 },
          { completionPercentage: 110, requiredRevenue: 1584000, bonusPercentage: 6.19, bonus: 98098, salary: 21000, totalSalary: 119098 },
          { completionPercentage: 120, requiredRevenue: 1728000, bonusPercentage: 6.75, bonus: 116640, salary: 21000, totalSalary: 137640 },
          { completionPercentage: 130, requiredRevenue: 1872000, bonusPercentage: 7.32, bonus: 137074, salary: 21000, totalSalary: 158074 }
        ],
        color: '#3498db',
        order: 2,
      },
    }),
    prisma.grade.create({
      data: {
        name: 'Эксперт',
        description: 'Высококвалифицированный специалист',
        plan: 1620000,
        minRevenue: 1800000,
        maxRevenue: 2199999,
        performanceLevels: [
          { completionPercentage: 50, requiredRevenue: 810000, bonusPercentage: 3.00, bonus: 24300, salary: 27000, totalSalary: 51300 },
          { completionPercentage: 75, requiredRevenue: 1215000, bonusPercentage: 4.50, bonus: 54675, salary: 27000, totalSalary: 81675 },
          { completionPercentage: 100, requiredRevenue: 1620000, bonusPercentage: 6.00, bonus: 97200, salary: 27000, totalSalary: 124200 },
          { completionPercentage: 110, requiredRevenue: 1782000, bonusPercentage: 6.60, bonus: 117612, salary: 27000, totalSalary: 144612 },
          { completionPercentage: 120, requiredRevenue: 1944000, bonusPercentage: 7.20, bonus: 139968, salary: 27000, totalSalary: 166968 },
          { completionPercentage: 130, requiredRevenue: 2106000, bonusPercentage: 7.80, bonus: 164268, salary: 27000, totalSalary: 191268 }
        ],
        color: '#9b59b6',
        order: 3,
      },
    }),
    prisma.grade.create({
      data: {
        name: 'Мастер',
        description: 'Мастер продаж',
        plan: 1800000,
        minRevenue: 2200000,
        maxRevenue: 2599999,
        performanceLevels: [
          { completionPercentage: 50, requiredRevenue: 900000, bonusPercentage: 3.00, bonus: 27000, salary: 27000, totalSalary: 54000 },
          { completionPercentage: 75, requiredRevenue: 1350000, bonusPercentage: 4.50, bonus: 60750, salary: 27000, totalSalary: 87750 },
          { completionPercentage: 100, requiredRevenue: 1800000, bonusPercentage: 6.00, bonus: 108000, salary: 27000, totalSalary: 135000 },
          { completionPercentage: 110, requiredRevenue: 1980000, bonusPercentage: 6.60, bonus: 130680, salary: 27000, totalSalary: 157680 },
          { completionPercentage: 120, requiredRevenue: 2160000, bonusPercentage: 7.20, bonus: 155520, salary: 27000, totalSalary: 182520 },
          { completionPercentage: 130, requiredRevenue: 2340000, bonusPercentage: 7.80, bonus: 182520, salary: 27000, totalSalary: 209520 }
        ],
        color: '#e74c3c',
        order: 4,
      },
    }),
    prisma.grade.create({
      data: {
        name: 'Профессионал',
        description: 'Профессионал высшего уровня',
        plan: 1980000,
        minRevenue: 2600000,
        maxRevenue: 2999999,
        performanceLevels: [
          { completionPercentage: 50, requiredRevenue: 990000, bonusPercentage: 3.14, bonus: 31086, salary: 27000, totalSalary: 58086 },
          { completionPercentage: 75, requiredRevenue: 1485000, bonusPercentage: 4.70, bonus: 69795, salary: 27000, totalSalary: 96795 },
          { completionPercentage: 100, requiredRevenue: 1980000, bonusPercentage: 6.27, bonus: 124146, salary: 27000, totalSalary: 151146 },
          { completionPercentage: 110, requiredRevenue: 2178000, bonusPercentage: 6.90, bonus: 150282, salary: 27000, totalSalary: 177282 },
          { completionPercentage: 120, requiredRevenue: 2376000, bonusPercentage: 7.52, bonus: 178675, salary: 27000, totalSalary: 205675 },
          { completionPercentage: 130, requiredRevenue: 2574000, bonusPercentage: 8.15, bonus: 209790, salary: 27000, totalSalary: 236790 }
        ],
        color: '#f39c12',
        order: 5,
      },
    }),
    prisma.grade.create({
      data: {
        name: 'Лидер продаж',
        description: 'Лидер продаж - высший уровень',
        plan: 2160000,
        minRevenue: 3000000,
        maxRevenue: 3400000,
        performanceLevels: [
          { completionPercentage: 50, requiredRevenue: 1080000, bonusPercentage: 3.25, bonus: 35100, salary: 27000, totalSalary: 62100 },
          { completionPercentage: 75, requiredRevenue: 1620000, bonusPercentage: 4.88, bonus: 79056, salary: 27000, totalSalary: 106056 },
          { completionPercentage: 100, requiredRevenue: 2160000, bonusPercentage: 6.50, bonus: 140400, salary: 27000, totalSalary: 167400 },
          { completionPercentage: 110, requiredRevenue: 2376000, bonusPercentage: 7.15, bonus: 169884, salary: 27000, totalSalary: 196884 },
          { completionPercentage: 120, requiredRevenue: 2592000, bonusPercentage: 7.80, bonus: 202176, salary: 27000, totalSalary: 229176 },
          { completionPercentage: 130, requiredRevenue: 2808000, bonusPercentage: 8.45, bonus: 237276, salary: 27000, totalSalary: 264276 }
        ],
        color: '#e67e22',
        order: 6,
      },
    }),
  ]);

  console.log(`✅ Created ${grades.length} grades`);

  // Создаем участников
  const participants = await Promise.all([
    prisma.participant.create({
      data: {
        telegramId: '123456789',
        username: 'ivan_petrov',
        firstName: 'Иван',
        lastName: 'Петров',
        phoneNumber: '+7 900 123-45-67',
        gradeId: grades[0].id, // Junior
        userId: user.id,
      },
    }),
    prisma.participant.create({
      data: {
        telegramId: '987654321',
        username: 'maria_smirnova',
        firstName: 'Мария',
        lastName: 'Смирнова',
        phoneNumber: '+7 900 765-43-21',
        gradeId: grades[1].id, // Middle
      },
    }),
    prisma.participant.create({
      data: {
        telegramId: '555555555',
        username: 'alex_developer',
        firstName: 'Александр',
        lastName: 'Иванов',
        gradeId: grades[2].id, // Senior
      },
    }),
  ]);

  console.log(`✅ Created ${participants.length} participants`);

  // Создаем текущий период
  const currentDate = new Date();
  const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  const currentPeriod = await prisma.period.create({
    data: {
      name: `Период ${currentDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}`,
      startDate,
      endDate,
      type: 'MONTHLY',
      status: 'ACTIVE',
    },
  });

  console.log('✅ Created current period:', currentPeriod.name);

  // Связываем грейды с периодом
  for (const grade of grades) {
    await prisma.periodGrade.create({
      data: {
        periodId: currentPeriod.id,
        gradeId: grade.id,
        amount: grade.plan,
      },
    });
  }

  // Создаем платежи для участников
  for (const participant of participants) {
    const grade = grades.find(g => g.id === participant.gradeId);
    if (grade) {
      // Получаем бонус из подуровня выполнения (берем 100% выполнения)
      const performanceLevels = grade.performanceLevels as any[];
      const baseLevel = performanceLevels.find(level => level.completionPercentage === 100);
      const amount = baseLevel ? baseLevel.totalSalary : 50000; // Или дефолтное значение
      
      await prisma.payment.create({
        data: {
          participantId: participant.id,
          periodId: currentPeriod.id,
          amount: amount,
          status: Math.random() > 0.5 ? 'PAID' : 'PENDING',
          paidAt: Math.random() > 0.5 ? new Date() : null,
        },
      });
    }
  }

  console.log('✅ Created payments for participants');

  // Создаем логи
  await prisma.log.create({
    data: {
      type: 'SYSTEM',
      message: 'База данных инициализирована тестовыми данными',
    },
  });

  console.log('🎉 Seed completed successfully!');
  console.log('\n📝 Тестовые учетные записи:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Администратор:');
  console.log('  Email: admin@test.com');
  console.log('  Пароль: admin123');
  console.log('\nПользователь:');
  console.log('  Email: user@test.com');
  console.log('  Пароль: user123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });