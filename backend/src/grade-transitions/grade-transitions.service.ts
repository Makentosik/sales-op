import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Participant, Grade, Period, TransitionType, WarningStatus, GradeTransition } from '@prisma/client';

interface ParticipantWithGrade extends Participant {
  grade: Grade | null;
}

@Injectable()
export class GradeTransitionsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Обработка переходов грейдов при завершении периода
   */
  async processGradeTransitions(periodId: string): Promise<GradeTransition[]> {
    const transitions: GradeTransition[] = [];
    
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
      const completionPercentage = participant.grade 
        ? (participant.revenue / participant.grade.plan) * 100 
        : 0;

      // Рассчитываем новый грейд
      const newGradeResult = await this.calculateNewGrade(
        participant,
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
   */
  private checkPromotion(
    participant: ParticipantWithGrade,
    currentGrade: Grade,
    allGrades: Grade[],
    currentGradeIndex: number,
    completionPercentage: number
  ) {
    // Условие 1: Выполнил план текущего грейда на 120% и выше
    if (completionPercentage >= 120) {
      const nextGrade = allGrades[currentGradeIndex - 1]; // ИСПРАВЛЕНО: повышение = меньший индекс
      if (nextGrade) {
        return {
          shouldPromote: true,
          targetGrade: nextGrade,
          reason: `Выполнил план на ${completionPercentage.toFixed(1)}% (≥120%)`
        };
      }
    }

    // Условие 2: Выполнил план более высокого грейда на 100%
    for (let i = currentGradeIndex - 1; i >= 0; i--) { // ИСПРАВЛЕНО: ищем выше по иерархии
      const higherGrade = allGrades[i];
      const higherGradeCompletion = (participant.revenue / higherGrade.plan) * 100;
      
      if (higherGradeCompletion >= 100) {
        return {
          shouldPromote: true,
          targetGrade: higherGrade,
          reason: `Выполнил план грейда "${higherGrade.name}" на ${higherGradeCompletion.toFixed(1)}%`
        };
      }
    }

    return { shouldPromote: false, targetGrade: allGrades[0], reason: '' };
  }

  /**
   * Проверяет необходимость понижения грейда
   */
  private checkDemotion(
    participant: ParticipantWithGrade,
    currentGrade: Grade,
    allGrades: Grade[],
    currentGradeIndex: number,
    completionPercentage: number
  ) {
    // Немедленное понижение при выполнении плана на 70% и ниже
    if (completionPercentage <= 70) {
      const lowerGrade = allGrades[currentGradeIndex + 1]; // ИСПРАВЛЕНО: понижение = больший индекс
      if (lowerGrade) {
        return {
          shouldDemote: true,
          targetGrade: lowerGrade,
          reason: `Выполнил план на ${completionPercentage.toFixed(1)}% (≤70%)`
        };
      }
    }

    // Проверка предупреждений и истечения срока
    if (participant.warningStatus && participant.warningPeriodsLeft <= 1) {
      const lowerGrade = allGrades[currentGradeIndex + 1]; // ИСПРАВЛЕНО: понижение = больший индекс
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
   * Находит грейд по выручке
   */
  private findGradeByRevenue(revenue: number, grades: Grade[]): Grade | null {
    return grades.find(grade => 
      revenue >= grade.minRevenue && revenue <= grade.maxRevenue
    ) || null;
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
  ): Promise<GradeTransition> {
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
  async getParticipantTransitions(participantId: string): Promise<GradeTransition[]> {
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