import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { 
  GradePerformanceLevel, 
  ParticipantSalaryCalculation, 
  SalaryCalculationResponse,
  ParticipantSalaryDetailsResponse 
} from './salary-calculator.types';

// Локальные интерфейсы вместо Prisma типов
interface Participant {
  id: string;
  telegramId: string;
  username?: string | null;
  firstName: string;
  lastName?: string | null;
  phoneNumber?: string | null;
  revenue: number;
  isActive: boolean;
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  gradeId?: string | null;
  userId?: string | null;
}

interface Grade {
  id: string;
  name: string;
  description?: string | null;
  plan: number;
  minRevenue: number;
  maxRevenue: number;
  performanceLevels: any;
  color: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Period {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  type: string;
  status: string;
  participantSnapshots?: any;
  createdAt: Date;
  updatedAt: Date;
}

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
      currentGradeColor: '#6c757d',
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

    // Рассчитываем процент выполнения плана текущего грейда
    const planCompletion = (revenue / currentGrade.plan) * 100;

    // Получаем уровни производительности из текущего грейда
    const performanceLevels = this.parsePerformanceLevels(currentGrade.performanceLevels);

    // Находим подходящий уровень производительности
    const performanceLevel = this.findPerformanceLevel(planCompletion, performanceLevels);

    // Рассчитываем комиссию от выручки по процентам текущего грейда
    const commission = (revenue * performanceLevel.commissionRate) / 100;

    // Определяем грейд для оклада на основе выручки (какой грейд заслуживает по результату)
    const salaryGrade = this.findGradeByRevenue(revenue, allGrades);
    
    // Получаем оклад и название грейда по выручке
    const fixedSalaryData = salaryGrade 
      ? this.getFixedSalaryForGrade(salaryGrade, revenue)
      : { fixedSalary: performanceLevel.fixedSalary, gradeName: currentGrade.name };

    // Бонус отключен
    const bonus = 0;

    return {
      participantId: participant.id,
      participantName: `${participant.firstName} ${participant.lastName || ''}`.trim(),
      currentGrade: currentGrade.name,
      currentGradeId: currentGrade.id,
      currentGradeColor: currentGrade.color || '#006657',
      revenue,
      planCompletion,
      commissionRate: performanceLevel.commissionRate,
      commission,
      fixedSalary: fixedSalaryData.fixedSalary, // Оклад по грейду заслуженному выручкой
      fixedSalaryGrade: fixedSalaryData.gradeName, // Название грейда по выручке
      bonus,
      totalSalary: commission + fixedSalaryData.fixedSalary,
      performanceLevel: `${performanceLevel.minPercentage}%`, // Достигнутый уровень грейда
    };
  }

  /**
   * Парсит уровни производительности из JSON
   */
  private parsePerformanceLevels(performanceLevelsJson: any): GradePerformanceLevel[] {
    if (!performanceLevelsJson || !Array.isArray(performanceLevelsJson)) {
      return this.getDefaultPerformanceLevels();
    }

    // Преобразуем существующую структуру в новый формат
    const parsed: GradePerformanceLevel[] = [];
    
    for (let i = 0; i < performanceLevelsJson.length; i++) {
      const level = performanceLevelsJson[i];
      
      // Проверяем, если у нас старый формат (с completionPercentage)
      if (level.completionPercentage !== undefined) {
        const completionPercentage = level.completionPercentage;
        // Для первого элемента начинаем с 0, для остальных - с предыдущего уровня
        const prevCompletion = i === 0 ? 0 : performanceLevelsJson[i - 1].completionPercentage;
        
        // Максимальный процент - для последнего элемента до 1000%, для остальных - следующий уровень
        const maxPercentage = i === performanceLevelsJson.length - 1 ? 1000 : performanceLevelsJson[i + 1].completionPercentage;
        
        parsed.push({
          minPercentage: completionPercentage, // Начинаем с текущего уровня
          maxPercentage: maxPercentage,
          commissionRate: level.bonusPercentage || 0,
          fixedSalary: level.salary || 0,
          bonusAmount: 0, // Убираем бонусы
          description: level.description || `${completionPercentage}%-${maxPercentage === 1000 ? '100%+' : maxPercentage + '%'}`,
        });
      } else {
        // Новый формат
        parsed.push({
          minPercentage: level.minPercentage || 0,
          maxPercentage: level.maxPercentage || 100,
          commissionRate: level.commissionRate || 0,
          fixedSalary: level.fixedSalary || 0,
          bonusAmount: 0, // Убираем бонусы
          description: level.description || '',
        });
      }
    }
    
    // Для старого формата добавляем начальный уровень от 0 до первого
    if (parsed.length > 0 && performanceLevelsJson[0] && performanceLevelsJson[0].completionPercentage !== undefined) {
      const firstLevel = performanceLevelsJson[0];
      // Добавляем начальный уровень в начало
      parsed.unshift({
        minPercentage: 0,
        maxPercentage: firstLevel.completionPercentage,
        commissionRate: 0, // Нулевая комиссия до первого уровня
        fixedSalary: 20000, // Минимальный оклад
        bonusAmount: 0,
        description: `0%-${firstLevel.completionPercentage}%`,
      });
    }
    
    return parsed;
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
   * Использует принцип "снизу" - берет максимальный достигнутый уровень
   * Для менеджеров с низким выполнением (<70%) - дает минимальный уровень грейда
   */
  private findPerformanceLevel(
    completionPercentage: number,
    performanceLevels: GradePerformanceLevel[],
  ): GradePerformanceLevel {
    // Сортируем уровни по возрастанию minPercentage
    const sortedLevels = [...performanceLevels].sort((a, b) => a.minPercentage - b.minPercentage);
    
    // Убираем уровни с minPercentage = 0 (ниже 70%)
    const validLevels = sortedLevels.filter(level => level.minPercentage > 0);
    
    // Если нет валидных уровней, берем первый уровень
    if (validLevels.length === 0) {
      return sortedLevels[0] || this.getDefaultPerformanceLevels()[0];
    }
    
    // Если выполнение меньше минимального уровня - даем минимальный
    const minLevel = validLevels[0];
    if (completionPercentage < minLevel.minPercentage) {
      return minLevel;
    }
    
    // Ищем максимальный достигнутый уровень
    let selectedLevel = minLevel;
    
    for (const level of validLevels) {
      if (completionPercentage >= level.minPercentage) {
        selectedLevel = level;
      } else {
        break;
      }
    }

    return selectedLevel;
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
   * Получает фиксированный оклад для грейда на основе выручки и процента выполнения
   */
  private getFixedSalaryForGrade(grade: Grade, revenue: number = 0): { fixedSalary: number; gradeName: string } {
    const performanceLevels = this.parsePerformanceLevels(grade.performanceLevels);
    
    // Рассчитываем процент выполнения плана для данного грейда
    const planCompletion = grade.plan > 0 ? (revenue / grade.plan) * 100 : 0;
    
    // Находим подходящий уровень производительности для этого процента
    const targetLevel = this.findPerformanceLevel(planCompletion, performanceLevels);

    const fixedSalary = targetLevel?.fixedSalary || 27000; // Дефолтный оклад

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