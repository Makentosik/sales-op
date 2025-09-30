import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedLogs() {
  console.log('🌱 Создание тестовых логов...');

  // Получаем участников для создания логов
  const participants = await prisma.participant.findMany();
  const periods = await prisma.period.findMany();

  if (participants.length === 0) {
    console.log('⚠️  Нет участников в базе данных');
    return;
  }

  // Создаем тестовые логи
  const testLogs = [
    {
      type: 'SYSTEM',
      message: 'Система запущена и готова к работе',
      details: {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
      },
    },
    {
      type: 'PARTICIPANT_JOIN',
      message: `Новый участник ${participants[0].firstName} ${participants[0].lastName} присоединился к системе`,
      participantId: participants[0].id,
      details: {
        telegramId: participants[0].telegramId,
        joinedAt: participants[0].joinedAt,
      },
    },
    {
      type: 'GRADE_CHANGE',
      message: `Участник ${participants[0].firstName} получил новый грейд`,
      participantId: participants[0].id,
      details: {
        newGradeId: participants[0].gradeId,
        reason: 'Достиг необходимого уровня выручки',
      },
    },
    {
      type: 'PAYMENT',
      message: `Создан платеж для участника ${participants[0].firstName}`,
      participantId: participants[0].id,
      details: {
        amount: 50000,
        status: 'PENDING',
      },
    },
    {
      type: 'ERROR',
      message: 'Произошла ошибка при обработке данных',
      details: {
        errorCode: 'DATA_PROCESSING_ERROR',
        component: 'ParticipantService',
        stack: 'Test error stack trace',
      },
    },
  ];

  // Добавляем логи с периодами, если они есть
  if (periods.length > 0) {
    await prisma.log.create({
      data: {
        type: 'PERIOD_START',
        message: `Запущен новый период "${periods[0].name}"`,
        periodId: periods[0].id,
        details: {
          startDate: periods[0].startDate.toISOString(),
          endDate: periods[0].endDate.toISOString(),
          type: periods[0].type,
        },
      },
    });

    await prisma.log.create({
      data: {
        type: 'PERIOD_END',
        message: `Период "${periods[0].name}" завершен`,
        periodId: periods[0].id,
        details: {
          participantsCount: participants.length,
          totalRevenue: participants.reduce((sum, p) => sum + p.revenue, 0),
        },
      },
    });
  }

  // Создаем логи в базе данных
  for (const logData of testLogs) {
    await prisma.log.create({
      data: logData as any,
    });
  }

  const logsCreated = testLogs.length + (periods.length > 0 ? 2 : 0);
  console.log(`✅ Создано ${logsCreated} тестовых логов`);

  // Показываем статистику
  const logStats = await prisma.log.groupBy({
    by: ['type'],
    _count: true,
  });

  console.log('📊 Статистика логов по типам:');
  logStats.forEach(stat => {
    console.log(`  ${stat.type}: ${stat._count} записей`);
  });
}

seedLogs()
  .catch((e) => {
    console.error('❌ Ошибка при создании тестовых логов:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });