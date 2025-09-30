const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function importData(filename = null) {
  try {
    console.log('🔄 Импорт данных в PostgreSQL...');

    // Определяем файл для импорта
    const exportsDir = path.join(__dirname, '..', 'exports');
    let filepath;

    if (filename) {
      filepath = path.join(exportsDir, filename);
    } else {
      // Ищем последний экспорт
      const files = fs.readdirSync(exportsDir)
        .filter(f => f.startsWith('data-export-') && f.endsWith('.json'))
        .sort()
        .reverse();
      
      if (files.length === 0) {
        console.error('❌ Файлы экспорта не найдены в папке exports/');
        console.log('💡 Сначала выполните экспорт данных: npm run export-data');
        process.exit(1);
      }
      
      filepath = path.join(exportsDir, files[0]);
    }

    if (!fs.existsSync(filepath)) {
      console.error(`❌ Файл не найден: ${filepath}`);
      process.exit(1);
    }

    console.log(`📁 Импортируем данные из: ${filepath}`);

    // Читаем данные
    const rawData = fs.readFileSync(filepath, 'utf8');
    const exportData = JSON.parse(rawData);
    const { data } = exportData;

    console.log('\n📊 Статистика импорта:');
    console.log(`👥 Пользователи: ${data.users?.length || 0}`);
    console.log(`🎖️ Грейды: ${data.grades?.length || 0}`);
    console.log(`👤 Участники: ${data.participants?.length || 0}`);
    console.log(`📅 Периоды: ${data.periods?.length || 0}`);

    // Очищаем существующие данные (ОПАСНО! Только для чистой миграции)
    const confirmClear = process.env.FORCE_CLEAR === 'true' || process.argv.includes('--force-clear');
    
    if (confirmClear) {
      console.log('\n🧹 Очистка существующих данных...');
      await prisma.gradeTransition.deleteMany();
      await prisma.log.deleteMany();
      await prisma.payment.deleteMany();
      await prisma.periodGrade.deleteMany();
      await prisma.participant.deleteMany();
      await prisma.period.deleteMany();
      await prisma.grade.deleteMany();
      await prisma.user.deleteMany();
      console.log('✅ Данные очищены');
    }

    // Импорт пользователей
    if (data.users && data.users.length > 0) {
      console.log('\\n👥 Импорт пользователей...');
      for (const user of data.users) {
        await prisma.user.create({
          data: {
            id: user.id,
            email: user.email,
            password: user.password,
            name: user.name,
            role: user.role,
            createdAt: new Date(user.createdAt),
            updatedAt: new Date(user.updatedAt),
          },
        });
      }
      console.log(`✅ Импортировано ${data.users.length} пользователей`);
    }

    // Импорт грейдов
    if (data.grades && data.grades.length > 0) {
      console.log('\\n🎖️ Импорт грейдов...');
      for (const grade of data.grades) {
        await prisma.grade.create({
          data: {
            id: grade.id,
            name: grade.name,
            description: grade.description,
            plan: grade.plan,
            minRevenue: grade.minRevenue,
            maxRevenue: grade.maxRevenue,
            performanceLevels: grade.performanceLevels,
            color: grade.color,
            order: grade.order,
            isActive: grade.isActive,
            createdAt: new Date(grade.createdAt),
            updatedAt: new Date(grade.updatedAt),
          },
        });
      }
      console.log(`✅ Импортировано ${data.grades.length} грейдов`);
    }

    // Импорт участников
    if (data.participants && data.participants.length > 0) {
      console.log('\\n👤 Импорт участников...');
      for (const participant of data.participants) {
        await prisma.participant.create({
          data: {
            id: participant.id,
            telegramId: participant.telegramId,
            username: participant.username,
            firstName: participant.firstName,
            lastName: participant.lastName,
            phoneNumber: participant.phoneNumber,
            revenue: participant.revenue,
            isActive: participant.isActive,
            joinedAt: new Date(participant.joinedAt),
            gradeId: participant.gradeId,
            warningStatus: participant.warningStatus,
            warningPeriodsLeft: participant.warningPeriodsLeft,
            lastPeriodRevenue: participant.lastPeriodRevenue,
            lastCompletionPercentage: participant.lastCompletionPercentage,
            userId: participant.userId,
            createdAt: new Date(participant.createdAt),
            updatedAt: new Date(participant.updatedAt),
          },
        });
      }
      console.log(`✅ Импортировано ${data.participants.length} участников`);
    }

    // Импорт периодов
    if (data.periods && data.periods.length > 0) {
      console.log('\\n📅 Импорт периодов...');
      for (const period of data.periods) {
        await prisma.period.create({
          data: {
            id: period.id,
            name: period.name,
            startDate: new Date(period.startDate),
            endDate: new Date(period.endDate),
            type: period.type,
            status: period.status,
            participantSnapshots: period.participantSnapshots,
            createdAt: new Date(period.createdAt),
            updatedAt: new Date(period.updatedAt),
          },
        });
      }
      console.log(`✅ Импортировано ${data.periods.length} периодов`);
    }

    // Импорт платежей
    if (data.payments && data.payments.length > 0) {
      console.log('\\n💰 Импорт платежей...');
      for (const payment of data.payments) {
        await prisma.payment.create({
          data: {
            id: payment.id,
            participantId: payment.participantId,
            periodId: payment.periodId,
            amount: payment.amount,
            status: payment.status,
            paidAt: payment.paidAt ? new Date(payment.paidAt) : null,
            description: payment.description,
            createdAt: new Date(payment.createdAt),
            updatedAt: new Date(payment.updatedAt),
          },
        });
      }
      console.log(`✅ Импортировано ${data.payments.length} платежей`);
    }

    // Импорт связей период-грейд
    if (data.periodGrades && data.periodGrades.length > 0) {
      console.log('\\n📋 Импорт связей период-грейд...');
      for (const periodGrade of data.periodGrades) {
        await prisma.periodGrade.create({
          data: {
            id: periodGrade.id,
            periodId: periodGrade.periodId,
            gradeId: periodGrade.gradeId,
            amount: periodGrade.amount,
            createdAt: new Date(periodGrade.createdAt),
            updatedAt: new Date(periodGrade.updatedAt),
          },
        });
      }
      console.log(`✅ Импортировано ${data.periodGrades.length} связей период-грейд`);
    }

    // Импорт логов
    if (data.logs && data.logs.length > 0) {
      console.log('\\n📝 Импорт логов...');
      for (const log of data.logs) {
        await prisma.log.create({
          data: {
            id: log.id,
            type: log.type,
            message: log.message,
            details: log.details,
            participantId: log.participantId,
            periodId: log.periodId,
            createdAt: new Date(log.createdAt),
          },
        });
      }
      console.log(`✅ Импортировано ${data.logs.length} логов`);
    }

    // Импорт переходов грейдов
    if (data.gradeTransitions && data.gradeTransitions.length > 0) {
      console.log('\\n🔄 Импорт переходов грейдов...');
      for (const transition of data.gradeTransitions) {
        await prisma.gradeTransition.create({
          data: {
            id: transition.id,
            participantId: transition.participantId,
            fromGradeId: transition.fromGradeId,
            toGradeId: transition.toGradeId,
            periodId: transition.periodId,
            transitionType: transition.transitionType,
            reason: transition.reason,
            completionPercentage: transition.completionPercentage,
            revenue: transition.revenue,
            details: transition.details,
            createdAt: new Date(transition.createdAt),
          },
        });
      }
      console.log(`✅ Импортировано ${data.gradeTransitions.length} переходов грейдов`);
    }

    console.log('\\n🎉 Импорт завершен успешно!');
    console.log(`📅 Дата экспорта: ${exportData.metadata.exportDate}`);
    console.log(`📍 Источник: ${exportData.metadata.source}`);

  } catch (error) {
    console.error('❌ Ошибка при импорте данных:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Запуск импорта
const filename = process.argv[2];
importData(filename);