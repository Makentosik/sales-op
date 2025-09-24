import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePeriodDto, UpdatePeriodDto, CompletePeriodDto, PeriodStatus, PeriodType } from './dto/period.dto';
import { Period } from '@prisma/client';

@Injectable()
export class PeriodsService {
  constructor(private prisma: PrismaService) {}

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

    // Сохраняем снимок данных участников
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
      }));
    }

    // Обновляем статус периода
    const completedPeriod = await this.prisma.period.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        participantSnapshots: participantSnapshots as any,
      },
    });

    // Создаем лог о завершении периода
    await this.prisma.log.create({
      data: {
        type: 'PERIOD_END',
        message: `Период "${period.name}" завершен`,
        details: {
          periodId: id,
          participantCount: participantSnapshots ? (participantSnapshots as any[]).length : 0,
          completedAt: new Date().toISOString(),
        },
        periodId: id,
      },
    });

    return completedPeriod;
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