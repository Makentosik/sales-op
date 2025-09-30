import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Локальные типы вместо Prisma импортов
enum TransitionType {
  PROMOTION = 'PROMOTION',
  DEMOTION = 'DEMOTION',
  INITIAL = 'INITIAL'
}

enum WarningStatus {
  WARNING_90 = 'WARNING_90',
  WARNING_80 = 'WARNING_80'
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

interface GradeTransition {
  id: string;
  participantId: string;
  fromGradeId?: string | null;
  toGradeId: string;
  periodId: string;
  transitionType: TransitionType;
  reason: string;
  completionPercentage: number;
  revenue: number;
  details?: any;
  createdAt: Date;
}

interface ParticipantWithGrade {
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
  warningStatus?: WarningStatus | null;
  warningPeriodsLeft: number;
  lastPeriodRevenue: number;
  lastCompletionPercentage: number;
  userId?: string | null;
  grade: Grade | null;
}

@Injectable()
export class GradeTransitionsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Обработка переходов грейдов при завершении периода
   */
  async processGradeTransitions(periodId: string): Promise<any[]> {
    const transitions: any[] = [];
    
    // Получаем все грейды отсортированные по порядку
    const allGrades = await this.prisma.grade.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' }
    });

    // Получаем всех участников с их текущими грейдами
    const participants = await this.prisma.participant.findMany({
      where: { isActive: true },
      include: { grade: true }
    });

    for (const participant of participants) {
      // Приводим типы к нашим локальным интерфейсам
      const typedParticipant = participant as any as ParticipantWithGrade;
      const completionPercentage = participant.grade 
        ? (participant.revenue / participant.grade.plan) * 100 
        : 0;

      // Рассчитываем новый грейд
      const newGradeResult = await this.calculateNewGrade(
        typedParticipant,
        allGrades,
        completionPercentage
      );

      // Если нужен переход
      if (newGradeResult.shouldTransition && newGradeResult.newGrade) {
        const transition = await this.createTransition(
          participant,
          participant.grade,
          newGradeResult.newGrade,
          periodId,
          newGradeResult.transitionType,
          newGradeResult.reason,
          completionPercentage
        );
        
        transitions.push(transition);

        // Обновляем участника
        await this.updateParticipant(
          participant.id,
          newGradeResult.newGrade.id,
          newGradeResult.warningStatus,
          newGradeResult.warningPeriodsLeft,
          participant.revenue,
          completionPercentage
        );
      } else {
        // Обновляем только статус предупреждений и статистику
        await this.updateParticipantWarnings(
          participant.id,
          newGradeResult.warningStatus,
          newGradeResult.warningPeriodsLeft,
          participant.revenue,
          completionPercentage
        );
      }
    }

    return transitions;
  }

  /**
   * Рассчитывает новый грейд для участника на основе его результатов
   */
  private async calculateNewGrade(
    participant: ParticipantWithGrade,
    allGrades: Grade[],
    completionPercentage: number
  ) {
    const currentGrade = participant.grade;
    
    if (!currentGrade) {
      // Если у участника нет грейда, назначаем подходящий
      const appropriateGrade = this.findGradeByRevenue(participant.revenue, allGrades);
      const targetGrade = appropriateGrade || allGrades[0];
      if (!targetGrade) {
        throw new Error('Не найден подходящий грейд');
      }
      return {
        shouldTransition: true,
        newGrade: targetGrade,
        transitionType: TransitionType.INITIAL,
        reason: 'Начальное назначение грейда',
        warningStatus: null,
        warningPeriodsLeft: 0
      };
    }

    const currentGradeIndex = allGrades.findIndex(g => g.id === currentGrade.id);

    // Проверяем возможность повышения
    const promotionResult = this.checkPromotion(
      participant,
      currentGrade,
      allGrades,
      currentGradeIndex,
      completionPercentage
    );

    if (promotionResult.shouldPromote) {
      return {
        shouldTransition: true,
        newGrade: promotionResult.targetGrade,
        transitionType: TransitionType.PROMOTION,
        reason: promotionResult.reason,
        warningStatus: null,
        warningPeriodsLeft: 0
      };
    }

    // Проверяем необходимость понижения
    const demotionResult = this.checkDemotion(
      participant,
      currentGrade,
      allGrades,
      currentGradeIndex,
      completionPercentage
    );

    if (demotionResult.shouldDemote) {
      return {
        shouldTransition: true,
        newGrade: demotionResult.targetGrade,
        transitionType: TransitionType.DEMOTION,
        reason: demotionResult.reason,
        warningStatus: null,
        warningPeriodsLeft: 0
      };
    }

    // Проверяем предупреждения
    const warningResult = this.checkWarnings(
      participant,
      completionPercentage
    );

    return {
      shouldTransition: false,
      newGrade: currentGrade,
      transitionType: TransitionType.INITIAL,
      reason: '',
      warningStatus: warningResult.warningStatus,
      warningPeriodsLeft: warningResult.warningPeriodsLeft
    };
  }

  /**
   * Проверяет возможность повышения грейда
   * Новая логика: менеджер поднимается на самый высокий грейд, план которого он выполнил
   */
  private checkPromotion(
    participant: ParticipantWithGrade,
    currentGrade: Grade,
    allGrades: Grade[],
    currentGradeIndex: number,
    completionPercentage: number
  ) {
    // Находим самый высокий грейд, план которого выполнен на 100% или выше
    let bestGradeIndex = currentGradeIndex;
    let bestGrade = currentGrade;
    let bestCompletion = completionPercentage;
    let promotionReason = '';

    // Проверяем все грейды выше текущего (меньший индекс = выше по иерархии)
    for (let i = currentGradeIndex - 1; i >= 0; i--) {
      const higherGrade = allGrades[i];
      const higherGradeCompletion = (participant.revenue / higherGrade.plan) * 100;
      
      // Если план этого грейда выполнен на 100% или выше
      if (higherGradeCompletion >= 100) {
        bestGradeIndex = i;
        bestGrade = higherGrade;
        bestCompletion = higherGradeCompletion;
        promotionReason = `Выполнил план грейда \"${higherGrade.name}\" на ${higherGradeCompletion.toFixed(1)}%`;
      } else {
        // Если не выполняет план этого грейда, останавливаемся
        // (так как грейды отсортированы по порядку)
        break;
      }
    }

    // Дополнительное условие: если выполнил текущий план на 120%+, можно подняться на 1 уровень
    if (bestGradeIndex === currentGradeIndex && completionPercentage >= 120) {
      const nextGrade = allGrades[currentGradeIndex - 1];
      if (nextGrade) {
        bestGradeIndex = currentGradeIndex - 1;
        bestGrade = nextGrade;
        bestCompletion = completionPercentage;
        promotionReason = `Выполнил план текущего грейда на ${completionPercentage.toFixed(1)}% (≥120%)`;
      }
    }

    // Если найден грейд выше текущего
    if (bestGradeIndex < currentGradeIndex) {
      return {
        shouldPromote: true,
        targetGrade: bestGrade,
        reason: promotionReason
      };
    }

    return { shouldPromote: false, targetGrade: allGrades[0], reason: '' };
  }

  /**
   * Проверяет необходимость понижения грейда
   * Новая логика: менеджер опускается на самый высокий грейд, план которого он может выполнить
   */
  private checkDemotion(
    participant: ParticipantWithGrade,
    currentGrade: Grade,
    allGrades: Grade[],
    currentGradeIndex: number,
    completionPercentage: number
  ) {
    // Проверяем предупреждения и истечения срока
    if (participant.warningStatus && participant.warningPeriodsLeft <= 1) {
      // Находим подходящий грейд по текущей выручке
      const appropriateGrade = this.findGradeByRevenue(participant.revenue, allGrades);
      
      if (appropriateGrade && appropriateGrade.order > currentGrade.order) {
        const warningReason = participant.warningStatus === WarningStatus.WARNING_90 
          ? '90%' 
          : '80%';
        return {
          shouldDemote: true,
          targetGrade: appropriateGrade,
          reason: `Не закрепился после предупреждения ${warningReason} - переход в соответствующий грейд`
        };
      } else if (!appropriateGrade) {
        // Если не подходит ни под один грейд, опускаем на один уровень
        const lowerGrade = allGrades[currentGradeIndex + 1];
        if (lowerGrade) {
          const warningReason = participant.warningStatus === WarningStatus.WARNING_90 
            ? '90%' 
            : '80%';
          return {
            shouldDemote: true,
            targetGrade: lowerGrade,
            reason: `Не закрепился после предупреждения ${warningReason}`
          };
        }
      }
    }

    // Немедленное понижение при выполнении плана на 70% и ниже
    if (completionPercentage <= 70) {
      // Находим подходящий грейд по текущей выручке
      const appropriateGrade = this.findGradeByRevenue(participant.revenue, allGrades);
      
      if (appropriateGrade && appropriateGrade.order > currentGrade.order) {
        return {
          shouldDemote: true,
          targetGrade: appropriateGrade,
          reason: `Выполнил план на ${completionPercentage.toFixed(1)}% (≤70%) - переход в соответствующий грейд по выручке`
        };
      } else {
        // Если по выручке не подходит или находится выше, опускаем на один уровень
        const lowerGrade = allGrades[currentGradeIndex + 1];
        if (lowerGrade) {
          return {
            shouldDemote: true,
            targetGrade: lowerGrade,
            reason: `Выполнил план на ${completionPercentage.toFixed(1)}% (≤70%)`
          };
        }
      }
    }

    return { shouldDemote: false, targetGrade: allGrades[0], reason: '' };
  }

  /**
   * Проверяет и обновляет статус предупреждений
   */
  private checkWarnings(participant: ParticipantWithGrade, completionPercentage: number) {
    let warningStatus: WarningStatus | null = null;
    let warningPeriodsLeft = 0;

    // Новое предупреждение на 90%
    if (completionPercentage >= 90 && completionPercentage < 100 && 
        participant.warningStatus !== WarningStatus.WARNING_90) {
      warningStatus = WarningStatus.WARNING_90;
      warningPeriodsLeft = 2;
    }
    // Новое предупреждение на 80%
    else if (completionPercentage >= 80 && completionPercentage < 90 &&
             participant.warningStatus !== WarningStatus.WARNING_80) {
      warningStatus = WarningStatus.WARNING_80;
      warningPeriodsLeft = 1;
    }
    // Продолжение существующего предупреждения
    else if (participant.warningStatus && completionPercentage < 100) {
      warningStatus = participant.warningStatus;
      warningPeriodsLeft = Math.max(0, participant.warningPeriodsLeft - 1);
    }
    // Сброс предупреждения при выполнении плана на 100%+
    else if (completionPercentage >= 100) {
      warningStatus = null;
      warningPeriodsLeft = 0;
    }

    return { warningStatus, warningPeriodsLeft };
  }

  /**
   * Находит самый высокий грейд, которому соответствует выручка
   * Если выручка превышает maxRevenue всех грейдов, возвращает самый высокий
   */
  private findGradeByRevenue(revenue: number, grades: Grade[]): Grade | null {
    // Сначала ищем точное соответствие по диапазону
    const exactMatch = grades.find(grade => 
      revenue >= grade.minRevenue && revenue <= grade.maxRevenue
    );
    
    if (exactMatch) {
      return exactMatch;
    }
    
    // Если выручка превышает максимальный диапазон, находим самый высокий грейд
    const highestGrade = grades.reduce((highest, current) => {
      return current.order < highest.order ? current : highest; // меньший order = выше в иерархии
    });
    
    // Если выручка превышает maxRevenue самого высокого грейда
    if (revenue > highestGrade.maxRevenue) {
      return highestGrade;
    }
    
    // Если выручка меньше минимального диапазона, находим самый низкий грейд
    const lowestGrade = grades.reduce((lowest, current) => {
      return current.order > lowest.order ? current : lowest; // больший order = ниже в иерархии
    });
    
    if (revenue < lowestGrade.minRevenue) {
      return lowestGrade;
    }
    
    return null;
  }

  /**
   * Создает запись о переходе грейда
   */
  private async createTransition(
    participant: Participant,
    fromGrade: Grade | null,
    toGrade: Grade,
    periodId: string,
    transitionType: TransitionType,
    reason: string,
    completionPercentage: number
  ): Promise<any> {
    return this.prisma.gradeTransition.create({
      data: {
        participantId: participant.id,
        fromGradeId: fromGrade?.id || null,
        toGradeId: toGrade.id,
        periodId,
        transitionType,
        reason,
        completionPercentage,
        revenue: participant.revenue,
        details: {
          fromGrade: fromGrade ? { id: fromGrade.id, name: fromGrade.name, plan: fromGrade.plan } : null,
          toGrade: { id: toGrade.id, name: toGrade.name, plan: toGrade.plan },
          participant: {
            id: participant.id,
            name: `${participant.firstName} ${participant.lastName || ''}`.trim()
          }
        }
      }
    });
  }

  /**
   * Обновляет участника после перехода грейда
   */
  private async updateParticipant(
    participantId: string,
    newGradeId: string,
    warningStatus: WarningStatus | null,
    warningPeriodsLeft: number,
    lastPeriodRevenue: number,
    lastCompletionPercentage: number
  ) {
    return this.prisma.participant.update({
      where: { id: participantId },
      data: {
        gradeId: newGradeId,
        warningStatus,
        warningPeriodsLeft,
        lastPeriodRevenue,
        lastCompletionPercentage
      }
    });
  }

  /**
   * Обновляет только предупреждения участника
   */
  private async updateParticipantWarnings(
    participantId: string,
    warningStatus: WarningStatus | null,
    warningPeriodsLeft: number,
    lastPeriodRevenue: number,
    lastCompletionPercentage: number
  ) {
    return this.prisma.participant.update({
      where: { id: participantId },
      data: {
        warningStatus,
        warningPeriodsLeft,
        lastPeriodRevenue,
        lastCompletionPercentage
      }
    });
  }

  /**
   * Получает историю переходов для участника
   */
  async getParticipantTransitions(participantId: string): Promise<any[]> {
    return this.prisma.gradeTransition.findMany({
      where: { participantId },
      include: {
        fromGrade: true,
        toGrade: true,
        period: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Получает всех участников с предупреждениями
   */
  async getParticipantsWithWarnings() {
    return this.prisma.participant.findMany({
      where: {
        warningStatus: { not: null },
        isActive: true
      },
      include: {
        grade: true
      },
      orderBy: { warningPeriodsLeft: 'asc' }
    });
  }
}