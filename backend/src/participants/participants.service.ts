import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateParticipantDto, UpdateParticipantDto } from './dto/participant.dto';
import { ImportParticipantDto } from './dto/import-participant.dto';
import { Participant } from '@prisma/client';

@Injectable()
export class ParticipantsService {
  constructor(private prisma: PrismaService) {}

  async findAll(includeGrade: boolean = true): Promise<Participant[]> {
    return this.prisma.participant.findMany({
      include: {
        grade: includeGrade,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<Participant> {
    const participant = await this.prisma.participant.findUnique({
      where: { id },
      include: {
        grade: true,
      },
    });

    if (!participant) {
      throw new NotFoundException(`Participant with ID ${id} not found`);
    }

    return participant;
  }

  async create(createParticipantDto: CreateParticipantDto): Promise<Participant> {
    try {
      return await this.prisma.participant.create({
        data: createParticipantDto,
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Participant with this Telegram ID already exists');
      }
      throw error;
    }
  }

  async update(
    id: string,
    updateParticipantDto: UpdateParticipantDto,
  ): Promise<Participant> {
    try {
      const participant = await this.prisma.participant.update({
        where: { id },
        data: updateParticipantDto,
        include: {
          grade: true,
        },
      });
      return participant;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Participant with ID ${id} not found`);
      }
      if (error.code === 'P2002') {
        throw new ConflictException('Participant with this Telegram ID already exists');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<Participant> {
    try {
      return await this.prisma.participant.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Participant with ID ${id} not found`);
      }
      throw error;
    }
  }

  async importParticipants(data: ImportParticipantDto[]): Promise<{
    created: number;
    updated: number;
    errors: string[];
  }> {
    let created = 0;
    let updated = 0;
    const errors: string[] = [];

    // Получаем все грейды для матчинга, отсортированные по order
    const grades = await this.prisma.grade.findMany({
      orderBy: { order: 'desc' },
    });

    // Находим начальный грейд (с наибольшим order, так как 0 - это самый высокий грейд)
    const defaultGrade = grades[0];
    
    if (!defaultGrade) {
      throw new Error('В системе нет ни одного грейда. Создайте хотя бы один грейд перед импортом.');
    }

    for (const item of data) {
      try {
        // Разделяем имя на фамилию и имя
        const nameParts = item.name.trim().split(' ');
        const lastName = nameParts[0] || '';
        const firstName = nameParts.slice(1).join(' ') || nameParts[0] || '';

        // Определяем грейд
        let gradeId: string | undefined;
        
        if (item.grade && item.grade.trim()) {
          console.log(`Обрабатываем грейд для ${item.name}: "${item.grade}"`);
          
          // Ищем грейд по точному совпадению названия
          const matchingGrade = grades.find(g => g.name === item.grade);
          
          if (matchingGrade) {
            gradeId = matchingGrade.id;
            console.log(`Найден грейд: ${matchingGrade.name}`);
          } else {
            console.log('Грейд не найден по точному совпадению');
            console.log('Доступные грейды:', grades.map(g => g.name));
          }
        } else {
          // Если грейд пустой, назначаем начальный грейд (с максимальным order)
          gradeId = defaultGrade.id;
          console.log(`Грейд не указан для ${item.name}, назначаем начальный грейд: ${defaultGrade.name}`);
        }

        // Генерируем уникальный telegramId если нет
        const telegramId = `imported_${item.name.replace(/\s/g, '_')}_${Date.now()}`;

        // Проверяем существует ли участник
        const existingParticipant = await this.prisma.participant.findFirst({
          where: {
            OR: [
              { firstName, lastName },
              { firstName: lastName, lastName: firstName } // На случай если имя и фамилия перепутаны
            ]
          }
        });

        const revenue = parseFloat(String(item.revenue).replace(/\s/g, '').replace(',', '.'));

        if (existingParticipant) {
          // Обновляем существующего
          await this.prisma.participant.update({
            where: { id: existingParticipant.id },
            data: {
              revenue,
              gradeId, // Всегда обновляем gradeId (либо указанный, либо дефолтный)
            },
          });
          updated++;
        } else {
          // Создаем нового
          await this.prisma.participant.create({
            data: {
              telegramId,
              firstName,
              lastName,
              revenue,
              gradeId, // gradeId всегда будет установлен (либо указанный, либо дефолтный)
            },
          });
          created++;
        }
      } catch (error) {
        errors.push(`Ошибка обработки ${item.name}: ${error.message}`);
      }
    }

    return { created, updated, errors };
  }
}
