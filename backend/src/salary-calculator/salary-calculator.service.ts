import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Participant, Grade, Period } from '@prisma/client';
import { 
  GradePerformanceLevel, 
  ParticipantSalaryCalculation, 
  SalaryCalculationResponse,
  ParticipantSalaryDetailsResponse 
} from './salary-calculator.types';

@Injectable()
export class SalaryCalculatorService {
  constructor(private prisma: PrismaService) {}

  /**
   * Рассчитывает зарплаты для всех активных участников в текущем периоде
   */
  async calculateSalaries(periodId?: string): Promise<SalaryCalculationResponse> {
    // Получаем активный период или указанный период
    let period: Period | null = null;
    if (periodId) {
      period = await this.prisma.period.findUnique({
        where: { id: periodId },
      });
      if (!period) {
        throw new BadRequestException('Период не найден');
      }
    } else {
      period = await this.prisma.period.findFirst({
        where: { status: 'ACTIVE' },
      });
      if (!period) {
        throw new BadRequestException('Нет активного периода');
      }
    }

    // Получаем всех активных участников с их грейдами
    const participants = await this.prisma.participant.findMany({
      where: { isActive: true },
      include: { grade: true },
    });

    // Получаем все грейды для определения окладов
    const allGrades = await this.prisma.grade.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });

    const calculations: ParticipantSalaryCalculation[] = [];
    let totalCommission = 0;
    let totalFixedSalary = 0;
    let totalBonus = 0;

    for (const participant of participants) {
      const calculation = await this.calculateParticipantSalary(
        participant,
        participant.grade,
        allGrades,
      );
      
      calculations.push(calculation);
      totalCommission += calculation.commission;
      totalFixedSalary += calculation.fixedSalary;
      totalBonus += calculation.bonus;
    }

    return {
      calculations,
      summary: {
        totalCommission,
        totalFixedSalary,
        totalBonus,
        totalSalary: totalCommission + totalFixedSalary + totalBonus,
        periodName: period.name,
        periodId: period.id,
      },
    };
  }

  /**
   * Рассчитывает зарплату для одного участника
   */
  async calculateParticipantSalary(
    participant: Participant,
    currentGrade: Grade | null,
    allGrades: Grade[],
  ): Promise<ParticipantSalaryCalculation> {
    const revenue = participant.revenue || 0;

    // Если нет грейда, возвращаем нулевые значения
    if (!currentGrade) {
      return {
        participantId: participant.id,
        participantName: `${participant.firstName} ${participant.lastName || ''}`.trim(),
        currentGrade: 'Не назначен',
        currentGradeId: '',
        revenue,
        planCompletion: 0,
        commissionRate: 0,
        commission: 0,
        fixedSalary: 0,
        fixedSalaryGrade: 'Не назначен',
        bonus: 0,
        totalSalary: 0,
        performanceLevel: 'Не назначен',
      };
    }

    // Рассчитываем процент выполнения плана
    const planCompletion = (revenue / currentGrade.plan) * 100;

    // Получаем уровни производительности из грейда
    const performanceLevels = this.parsePerformanceLevels(currentGrade.performanceLevels);

    // Находим подходящий уровень производительности
    const performanceLevel = this.findPerformanceLevel(planCompletion, performanceLevels);

    // Рассчитываем комиссию от выручки
    const commission = (revenue * performanceLevel.commissionRate) / 100;

    // Определяем грейд для оклада на основе выручки
    const salaryGrade = this.findGradeByRevenue(revenue, allGrades);
    const fixedSalaryData = salaryGrade 
      ? this.getFixedSalaryForGrade(salaryGrade)
      : { fixedSalary: performanceLevel.fixedSalary, gradeName: currentGrade.name };

    // Бонус (если есть)
    const bonus = performanceLevel.bonusAmount || 0;

    return {
      participantId: participant.id,
      participantName: `${participant.firstName} ${participant.lastName || ''}`.trim(),
      currentGrade: currentGrade.name,
      currentGradeId: currentGrade.id,
      revenue,
      planCompletion,
      commissionRate: performanceLevel.commissionRate,
      commission,
      fixedSalary: fixedSalaryData.fixedSalary,
      fixedSalaryGrade: fixedSalaryData.gradeName,
      bonus,
      totalSalary: commission + fixedSalaryData.fixedSalary + bonus,
      performanceLevel: `${performanceLevel.minPercentage}%-${performanceLevel.maxPercentage}%`,
    };
  }

  /**
   * Парсит уровни производительности из JSON
   */
  private parsePerformanceLevels(performanceLevelsJson: any): GradePerformanceLevel[] {
    if (!performanceLevelsJson || !Array.isArray(performanceLevelsJson)) {
      return this.getDefaultPerformanceLevels();
    }

    return performanceLevelsJson.map(level => ({
      minPercentage: level.minPercentage || 0,
      maxPercentage: level.maxPercentage || 100,
      commissionRate: level.commissionRate || 0,
      fixedSalary: level.fixedSalary || 0,
      bonusAmount: level.bonusAmount || 0,
      description: level.description || '',
    }));
  }

  /**
   * Возвращает дефолтные уровни производительности
   */
  private getDefaultPerformanceLevels(): GradePerformanceLevel[] {
    return [
      { minPercentage: 0, maxPercentage: 50, commissionRate: 0, fixedSalary: 20000 },
      { minPercentage: 50, maxPercentage: 60, commissionRate: 3.0, fixedSalary: 22000 },
      { minPercentage: 60, maxPercentage: 70, commissionRate: 3.5, fixedSalary: 25000 },
      { minPercentage: 70, maxPercentage: 80, commissionRate: 4.0, fixedSalary: 27000 },
      { minPercentage: 80, maxPercentage: 90, commissionRate: 4.5, fixedSalary: 30000 },
      { minPercentage: 90, maxPercentage: 100, commissionRate: 5.0, fixedSalary: 35000 },
      { minPercentage: 100, maxPercentage: 110, commissionRate: 5.5, fixedSalary: 40000 },
      { minPercentage: 110, maxPercentage: 120, commissionRate: 6.0, fixedSalary: 45000 },
      { minPercentage: 120, maxPercentage: 1000, commissionRate: 7.0, fixedSalary: 50000 },
    ];
  }

  /**
   * Находит подходящий уровень производительности для процента выполнения
   */
  private findPerformanceLevel(
    completionPercentage: number,
    performanceLevels: GradePerformanceLevel[],
  ): GradePerformanceLevel {
    const level = performanceLevels.find(
      level => completionPercentage >= level.minPercentage && completionPercentage < level.maxPercentage,
    );

    return level || performanceLevels[0];
  }

  /**
   * Находит грейд по выручке для определения оклада
   */
  private findGradeByRevenue(revenue: number, grades: Grade[]): Grade | null {
    // Сортируем грейды по минимальной выручке в порядке убывания
    const sortedGrades = [...grades].sort((a, b) => b.minRevenue - a.minRevenue);

    // Находим подходящий грейд
    for (const grade of sortedGrades) {
      if (revenue >= grade.minRevenue) {
        return grade;
      }
    }

    // Если выручка слишком мала, возвращаем самый низкий грейд
    return grades[grades.length - 1] || null;
  }

  /**
   * Получает фиксированный оклад для грейда
   */
  private getFixedSalaryForGrade(grade: Grade): { fixedSalary: number; gradeName: string } {
    const performanceLevels = this.parsePerformanceLevels(grade.performanceLevels);
    
    // Берем оклад для 100% выполнения или средний оклад
    const fullCompletionLevel = performanceLevels.find(
      level => level.minPercentage <= 100 && level.maxPercentage > 100,
    );

    const fixedSalary = fullCompletionLevel?.fixedSalary || 35000;

    return {
      fixedSalary,
      gradeName: grade.name,
    };
  }

  /**
   * Получает детали расчета для одного участника
   */
  async getParticipantSalaryDetails(participantId: string): Promise<ParticipantSalaryDetailsResponse> {
    const participant = await this.prisma.participant.findUnique({
      where: { id: participantId },
      include: { grade: true },
    });

    if (!participant) {
      throw new BadRequestException('Участник не найден');
    }

    const allGrades = await this.prisma.grade.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });

    const currentCalculation = await this.calculateParticipantSalary(
      participant,
      participant.grade,
      allGrades,
    );

    const performanceLevels = participant.grade
      ? this.parsePerformanceLevels(participant.grade.performanceLevels)
      : this.getDefaultPerformanceLevels();

    return {
      participant: {
        ...participant,
        grade: participant.grade,
      },
      currentCalculation,
      performanceLevels,
    };
  }
}