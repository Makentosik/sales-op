import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GradeTransitionsService } from '../grade-transitions/grade-transitions.service';
import { CreatePeriodDto, UpdatePeriodDto, CompletePeriodDto, PeriodStatus, PeriodType } from './dto/period.dto';
import { Period } from '@prisma/client';

@Injectable()
export class PeriodsService {
  constructor(
    private prisma: PrismaService,
    private gradeTransitionsService: GradeTransitionsService
  ) {}

  async findAll(): Promise<Period[]> {
    return this.prisma.period.findMany({
      include: {
        _count: {
          select: {
            payments: true,
            logs: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<Period> {
    const period = await this.prisma.period.findUnique({
      where: { id },
      include: {
        grades: {
          include: {
            grade: true,
          },
        },
        payments: {
          include: {
            participant: true,
          },
        },
        logs: true,
        _count: {
          select: {
            payments: true,
            logs: true,
          },
        },
      },
    });

    if (!period) {
      throw new NotFoundException(`Period with ID ${id} not found`);
    }

    return period;
  }

  async create(createPeriodDto: CreatePeriodDto): Promise<Period> {
    const { name, startDate, endDate, type } = createPeriodDto;

    // Проверяем, нет ли активного периода
    const activePeriod = await this.prisma.period.findFirst({
      where: {
        status: {
          in: ['ACTIVE', 'PENDING'],
        },
      },
    });

    if (activePeriod) {
      throw new ConflictException(`There is already an active period: ${activePeriod.name}`);
    }

    // Проверяем корректность дат
    if (new Date(startDate) >= new Date(endDate)) {
      throw new BadRequestException('Start date must be before end date');
    }

    try {
      const period = await this.prisma.period.create({
        data: {
          name,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          type,
          status: 'PENDING',
        },
      });

      // Создаем лог о создании периода
      await this.prisma.log.create({
        data: {
          type: 'PERIOD_START',
          message: `Период "${name}" создан`,
          details: {
            periodId: period.id,
            type,
            startDate,
            endDate,
          },
          periodId: period.id,
        },
      });

      return period;
    } catch (error) {
      throw error;
    }
  }

  async update(id: string, updatePeriodDto: UpdatePeriodDto): Promise<Period> {
    try {
      const period = await this.prisma.period.update({
        where: { id },
        data: {
          ...(updatePeriodDto.name && { name: updatePeriodDto.name }),
          ...(updatePeriodDto.startDate && { startDate: new Date(updatePeriodDto.startDate) }),
          ...(updatePeriodDto.endDate && { endDate: new Date(updatePeriodDto.endDate) }),
          ...(updatePeriodDto.type && { type: updatePeriodDto.type }),
          ...(updatePeriodDto.status && { status: updatePeriodDto.status }),
        },
      });

      return period;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Period with ID ${id} not found`);
      }
      throw error;
    }
  }

  async activate(id: string): Promise<Period> {
    const period = await this.findOne(id);

    if (period.status !== 'PENDING') {
      throw new BadRequestException('Only pending periods can be activated');
    }

    return this.update(id, { status: PeriodStatus.ACTIVE });
  }

  async complete(id: string, completePeriodDto: CompletePeriodDto = {}): Promise<Period> {
    const period = await this.findOne(id);

    if (period.status !== 'ACTIVE') {
      throw new BadRequestException('Only active periods can be completed');
    }

    // Сохраняем снимок данных участников ДО обработки переходов
    let participantSnapshots: any = null;
    if (completePeriodDto.saveSnapshot !== false) {
      const participants = await this.prisma.participant.findMany({
        include: {
          grade: true,
        },
      });

      participantSnapshots = participants.map(participant => ({
        id: participant.id,
        firstName: participant.firstName,
        lastName: participant.lastName,
        revenue: participant.revenue,
        grade: participant.grade ? {
          id: participant.grade.id,
          name: participant.grade.name,
          plan: participant.grade.plan,
        } : null,
        completionPercentage: participant.grade 
          ? Math.round((participant.revenue / participant.grade.plan) * 100)
          : 0,
        snapshotAt: new Date().toISOString(),
        // Добавляем информацию о предупреждениях на момент завершения периода
        warningStatus: participant.warningStatus,
        warningPeriodsLeft: participant.warningPeriodsLeft,
      }));
    }

    // ГЛАВНОЕ: Обрабатываем переходы грейдов при завершении периода
    console.log(`Обработка переходов грейдов для периода: ${period.name}`);
    const gradeTransitions = await this.gradeTransitionsService.processGradeTransitions(id);
    console.log(`Выполнено переходов: ${gradeTransitions.length}`);

    // Обновляем статус периода
    const completedPeriod = await this.prisma.period.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        participantSnapshots: participantSnapshots as any,
      },
    });

    // Создаем лог о завершении периода с информацией о переходах
    await this.prisma.log.create({
      data: {
        type: 'PERIOD_END',
        message: `Период "${period.name}" завершен`,
        details: {
          periodId: id,
          participantCount: participantSnapshots ? (participantSnapshots as any[]).length : 0,
          gradeTransitionsCount: gradeTransitions.length,
          completedAt: new Date().toISOString(),
          transitions: gradeTransitions.map(t => ({
            participantId: t.participantId,
            type: t.transitionType,
            reason: t.reason,
            completionPercentage: t.completionPercentage
          }))
        },
        periodId: id,
      },
    });

    // Создаем отдельные логи для каждого перехода
    for (const transition of gradeTransitions) {
      await this.prisma.log.create({
        data: {
          type: 'GRADE_CHANGE',
          message: `Переход грейда: ${transition.reason}`,
          details: {
            transitionId: transition.id,
            transitionType: transition.transitionType,
            completionPercentage: transition.completionPercentage,
            revenue: transition.revenue
          },
          participantId: transition.participantId,
          periodId: id,
        },
      });
    }

    return completedPeriod;
  }

  /**
   * Получить все переходы грейдов для конкретного периода
   */
  async getPeriodGradeTransitions(periodId: string) {
    const period = await this.findOne(periodId);
    
    const transitions = await this.prisma.gradeTransition.findMany({
      where: { periodId },
      include: {
        participant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            telegramId: true
          }
        },
        fromGrade: {
          select: {
            id: true,
            name: true,
            plan: true,
            color: true,
            order: true
          }
        },
        toGrade: {
          select: {
            id: true,
            name: true,
            plan: true,
            color: true,
            order: true
          }
        }
      },
      orderBy: [
        { transitionType: 'desc' }, // Сначала повышения, потом понижения
        { completionPercentage: 'desc' } // По убыванию процента выполнения
      ]
    });

    // Группируем переходы по типам
    const promotions = transitions.filter(t => t.transitionType === 'PROMOTION');
    const demotions = transitions.filter(t => t.transitionType === 'DEMOTION');
    const initialAssignments = transitions.filter(t => t.transitionType === 'INITIAL');

    // Статистика переходов
    const stats = {
      totalTransitions: transitions.length,
      promotions: promotions.length,
      demotions: demotions.length,
      initialAssignments: initialAssignments.length,
      averageCompletionPercentage: transitions.length > 0 
        ? Math.round(transitions.reduce((sum, t) => sum + t.completionPercentage, 0) / transitions.length)
        : 0
    };

    return {
      period: {
        id: period.id,
        name: period.name,
        startDate: period.startDate,
        endDate: period.endDate,
        status: period.status
      },
      stats,
      transitions: {
        promotions: promotions.map(t => this.formatTransition(t)),
        demotions: demotions.map(t => this.formatTransition(t)),
        initialAssignments: initialAssignments.map(t => this.formatTransition(t)),
        all: transitions.map(t => this.formatTransition(t))
      }
    };
  }

  /**
   * Форматирует переход для отображения
   */
  private formatTransition(transition: any) {
    const participantName = `${transition.participant.firstName} ${transition.participant.lastName || ''}`.trim();
    
    let directionIcon = '';
    let statusColor = '';
    
    switch (transition.transitionType) {
      case 'PROMOTION':
        directionIcon = '⬆️';
        statusColor = '#4caf50'; // зеленый
        break;
      case 'DEMOTION':
        directionIcon = '⬇️';
        statusColor = '#f44336'; // красный
        break;
      case 'INITIAL':
        directionIcon = '🎯';
        statusColor = '#2196f3'; // синий
        break;
    }

    return {
      id: transition.id,
      participant: {
        id: transition.participant.id,
        name: participantName,
        telegramId: transition.participant.telegramId
      },
      fromGrade: transition.fromGrade,
      toGrade: transition.toGrade,
      transitionType: transition.transitionType,
      reason: transition.reason,
      completionPercentage: Math.round(transition.completionPercentage * 100) / 100,
      revenue: transition.revenue,
      createdAt: transition.createdAt,
      // Дополнительные поля для UI
      display: {
        directionIcon,
        statusColor,
        summary: this.generateTransitionSummary(transition, participantName)
      }
    };
  }

  /**
   * Генерирует краткое описание перехода
   */
  private generateTransitionSummary(transition: any, participantName: string): string {
    switch (transition.transitionType) {
      case 'PROMOTION':
        const fromGradeName = transition.fromGrade?.name || 'Без грейда';
        return `${participantName}: ${fromGradeName} → ${transition.toGrade.name} (${Math.round(transition.completionPercentage)}%)`;
      case 'DEMOTION':
        return `${participantName}: ${transition.fromGrade.name} → ${transition.toGrade.name} (${Math.round(transition.completionPercentage)}%)`;
      case 'INITIAL':
        return `${participantName}: Назначен в ${transition.toGrade.name} (${Math.round(transition.completionPercentage)}%)`;
      default:
        return `${participantName}: Изменение грейда`;
    }
  }

  /**
   * Получить краткую сводку переходов для периода
   */
  async getPeriodGradeTransitionsSummary(periodId: string) {
    const period = await this.findOne(periodId);
    
    const transitions = await this.prisma.gradeTransition.findMany({
      where: { periodId },
      include: {
        participant: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        fromGrade: {
          select: {
            name: true
          }
        },
        toGrade: {
          select: {
            name: true
          }
        }
      }
    });

    const promotions = transitions.filter(t => t.transitionType === 'PROMOTION');
    const demotions = transitions.filter(t => t.transitionType === 'DEMOTION');
    const initialAssignments = transitions.filter(t => t.transitionType === 'INITIAL');

    return {
      period: {
        id: period.id,
        name: period.name,
        status: period.status
      },
      summary: {
        totalTransitions: transitions.length,
        promotions: promotions.length,
        demotions: demotions.length,
        initialAssignments: initialAssignments.length,
        // Краткие списки для отображения
        promotionsList: promotions.map(t => {
          const name = `${t.participant.firstName} ${t.participant.lastName || ''}`.trim();
          const fromGrade = t.fromGrade?.name || 'Без грейда';
          return `${name}: ${fromGrade} → ${t.toGrade.name}`;
        }),
        demotionsList: demotions.map(t => {
          const name = `${t.participant.firstName} ${t.participant.lastName || ''}`.trim();
          const fromGrade = t.fromGrade?.name || 'Без грейда';
          return `${name}: ${fromGrade} → ${t.toGrade.name}`;
        }),
        initialAssignmentsList: initialAssignments.map(t => {
          const name = `${t.participant.firstName} ${t.participant.lastName || ''}`.trim();
          return `${name}: Назначен в ${t.toGrade.name}`;
        })
      }
    };
  }

  async cancel(id: string): Promise<Period> {
    const period = await this.findOne(id);

    if (period.status === 'COMPLETED') {
      throw new BadRequestException('Completed periods cannot be cancelled');
    }

    return this.update(id, { status: PeriodStatus.CANCELLED });
  }

  async remove(id: string): Promise<Period> {
    const period = await this.findOne(id);

    if (period.status === 'ACTIVE') {
      throw new BadRequestException('Active periods cannot be deleted');
    }

    try {
      return await this.prisma.period.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Period with ID ${id} not found`);
      }
      throw error;
    }
  }

  // Вспомогательная функция для генерации названий периодов
  async generatePeriodName(type: PeriodType, startDate: Date): Promise<string> {
    const monthNames = [
      'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];

    const year = startDate.getFullYear();
    const month = startDate.getMonth();
    const day = startDate.getDate();

    switch (type) {
      case PeriodType.MONTHLY:
        return `${monthNames[month]} ${year}`;
      
      case PeriodType.TEN_DAYS:
        const decade = Math.ceil(day / 10);
        const decadeName = decade === 1 ? '1-10' : decade === 2 ? '11-20' : '21-31';
        return `${monthNames[month]} ${year} (${decadeName})`;
      
      default:
        return `Период от ${startDate.toLocaleDateString('ru-RU')}`;
    }
  }

  // Получить текущий активный период
  async getCurrentPeriod(): Promise<Period | null> {
    return this.prisma.period.findFirst({
      where: {
        status: 'ACTIVE',
      },
      include: {
        _count: {
          select: {
            payments: true,
          },
        },
      },
    });
  }

  // Получить статистику по периоду
  async getPeriodStats(id: string) {
    const period = await this.findOne(id);
    
    // Получаем данные участников
    let participants: any[] = [];
    
    // Проверяем, есть ли сохраненный снимок
    if (period.status === 'COMPLETED' && (period as any).participantSnapshots) {
      participants = (period as any).participantSnapshots;
    } else {
      // Если нет снимка, берем текущие данные
      const currentParticipants = await this.prisma.participant.findMany({
        include: { grade: true },
      });
      
      participants = currentParticipants.map(p => ({
        id: p.id,
        firstName: p.firstName,
        lastName: p.lastName,
        revenue: p.revenue,
        grade: p.grade,
      }));
    }

    const totalParticipants = participants.length;
    const totalRevenue = participants.reduce((sum: number, p: any) => sum + (p.revenue || 0), 0);
    const completedPlans = participants.filter((p: any) => {
      if (!p.grade) return false;
      const completion = (p.revenue || 0) / (p.grade.plan || 1);
      return completion >= 1;
    }).length;

    return {
      totalParticipants,
      totalRevenue,
      completedPlans,
      completionRate: totalParticipants > 0 ? (completedPlans / totalParticipants) * 100 : 0,
    };
  }
}