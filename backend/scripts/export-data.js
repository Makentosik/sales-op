const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function exportData() {
  try {
    console.log('🔄 Экспорт данных из SQLite...');

    // Экспорт всех основных данных
    const data = {
      users: await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          password: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      grades: await prisma.grade.findMany({
        select: {
          id: true,
          name: true,
          description: true,
          plan: true,
          minRevenue: true,
          maxRevenue: true,
          performanceLevels: true,
          color: true,
          order: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      participants: await prisma.participant.findMany({
        select: {
          id: true,
          telegramId: true,
          username: true,
          firstName: true,
          lastName: true,
          phoneNumber: true,
          revenue: true,
          isActive: true,
          joinedAt: true,
          gradeId: true,
          warningStatus: true,
          warningPeriodsLeft: true,
          lastPeriodRevenue: true,
          lastCompletionPercentage: true,
          userId: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      periods: await prisma.period.findMany({
        select: {
          id: true,
          name: true,
          startDate: true,
          endDate: true,
          type: true,
          status: true,
          participantSnapshots: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      payments: await prisma.payment.findMany({
        select: {
          id: true,
          participantId: true,
          periodId: true,
          amount: true,
          status: true,
          paidAt: true,
          description: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      periodGrades: await prisma.periodGrade.findMany({
        select: {
          id: true,
          periodId: true,
          gradeId: true,
          amount: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      logs: await prisma.log.findMany({
        select: {
          id: true,
          type: true,
          message: true,
          details: true,
          participantId: true,
          periodId: true,
          createdAt: true,
        },
      }),
      gradeTransitions: await prisma.gradeTransition.findMany({
        select: {
          id: true,
          participantId: true,
          fromGradeId: true,
          toGradeId: true,
          periodId: true,
          transitionType: true,
          reason: true,
          completionPercentage: true,
          revenue: true,
          details: true,
          createdAt: true,
        },
      }),
    };

    // Добавляем метаданные
    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        source: 'SQLite',
        version: '1.0',
        description: 'Экспорт данных для миграции на PostgreSQL',
      },
      data,
      statistics: {
        users: data.users.length,
        grades: data.grades.length,
        participants: data.participants.length,
        periods: data.periods.length,
        payments: data.payments.length,
        periodGrades: data.periodGrades.length,
        logs: data.logs.length,
        gradeTransitions: data.gradeTransitions.length,
      },
    };

    // Создаем папку exports если её нет
    const exportsDir = path.join(__dirname, '..', 'exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    // Сохраняем в файл
    const filename = `data-export-${new Date().toISOString().split('T')[0]}.json`;
    const filepath = path.join(exportsDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(exportData, null, 2), 'utf8');

    console.log('✅ Экспорт завершен успешно!');
    console.log(`📁 Файл сохранен: ${filepath}`);
    console.log('\n📊 Статистика экспорта:');
    console.log(`👥 Пользователи: ${exportData.statistics.users}`);
    console.log(`🎖️ Грейды: ${exportData.statistics.grades}`);
    console.log(`👤 Участники: ${exportData.statistics.participants}`);
    console.log(`📅 Периоды: ${exportData.statistics.periods}`);
    console.log(`💰 Платежи: ${exportData.statistics.payments}`);
    console.log(`📋 Период-Грейды: ${exportData.statistics.periodGrades}`);
    console.log(`📝 Логи: ${exportData.statistics.logs}`);
    console.log(`🔄 Переходы грейдов: ${exportData.statistics.gradeTransitions}`);

    // Дополнительно сохраняем только критически важные данные
    const essentialData = {
      metadata: exportData.metadata,
      data: {
        users: data.users,
        grades: data.grades,
        participants: data.participants,
        periods: data.periods.filter(p => p.status === 'ACTIVE' || p.status === 'COMPLETED'),
      },
      statistics: {
        users: data.users.length,
        grades: data.grades.length,
        participants: data.participants.length,
        activePeriods: data.periods.filter(p => p.status === 'ACTIVE' || p.status === 'COMPLETED').length,
      },
    };

    const essentialFilename = `essential-data-export-${new Date().toISOString().split('T')[0]}.json`;
    const essentialFilepath = path.join(exportsDir, essentialFilename);
    fs.writeFileSync(essentialFilepath, JSON.stringify(essentialData, null, 2), 'utf8');

    console.log(`\n💎 Критически важные данные сохранены: ${essentialFilepath}`);

  } catch (error) {
    console.error('❌ Ошибка при экспорте данных:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

exportData();