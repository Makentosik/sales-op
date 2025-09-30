import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGradeDto, UpdateGradeDto } from './dto/grade.dto';
// Local interface instead of Prisma import
interface Grade {
  id: string;
  name: string;
  description?: string | null;
  plan: number;
  minRevenue?: number | null;
  maxRevenue?: number | null;
  performanceLevels: any;
  color?: string | null;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count?: { participants: number };
}

@Injectable()
export class GradesService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<Grade[]> {
    return this.prisma.grade.findMany({
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { participants: true },
        },
      },
    });
  }

  async findOne(id: string): Promise<Grade> {
    const grade = await this.prisma.grade.findUnique({
      where: { id },
      include: {
        _count: {
          select: { participants: true },
        },
      },
    });

    if (!grade) {
      throw new NotFoundException(`Grade with ID ${id} not found`);
    }

    return grade;
  }

  async create(createGradeDto: CreateGradeDto): Promise<Grade> {
    try {
      return await this.prisma.grade.create({
        data: {
          name: createGradeDto.name,
          description: createGradeDto.description,
          plan: createGradeDto.plan,
          minRevenue: createGradeDto.minRevenue,
          maxRevenue: createGradeDto.maxRevenue,
          performanceLevels: createGradeDto.performanceLevels as any,
          color: createGradeDto.color || '#006657',
          order: createGradeDto.order || 0,
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Grade with this name already exists');
      }
      throw error;
    }
  }

  async update(id: string, updateGradeDto: UpdateGradeDto): Promise<Grade> {
    try {
      const updateData: any = { ...updateGradeDto };
      if (updateData.performanceLevels) {
        updateData.performanceLevels = updateData.performanceLevels as any;
      }
      
      const grade = await this.prisma.grade.update({
        where: { id },
        data: updateData,
      });
      return grade;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Grade with ID ${id} not found`);
      }
      if (error.code === 'P2002') {
        throw new ConflictException('Grade with this name already exists');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<Grade> {
    try {
      // Проверяем, есть ли участники с этим грейдом
      const participantsCount = await this.prisma.participant.count({
        where: { gradeId: id },
      });

      if (participantsCount > 0) {
        throw new ConflictException(
          `Cannot delete grade. It has ${participantsCount} participants assigned to it`,
        );
      }

      return await this.prisma.grade.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Grade with ID ${id} not found`);
      }
      throw error;
    }
  }

  async getGradeByRevenue(revenue: number): Promise<Grade | null> {
    return this.prisma.grade.findFirst({
      where: {
        minRevenue: { lte: revenue },
        maxRevenue: { gte: revenue },
        isActive: true,
      },
      orderBy: { order: 'asc' },
    });
  }

  async getGradeStats() {
    const grades = await this.prisma.grade.findMany({
      include: {
        _count: {
          select: { participants: true },
        },
      },
      orderBy: { order: 'asc' },
    });

    const totalParticipants = grades.reduce((sum, grade) => sum + grade._count.participants, 0);

    return grades.map((grade) => ({
      ...grade,
      participantPercentage: totalParticipants > 0 
        ? Math.round((grade._count.participants / totalParticipants) * 100) 
        : 0,
    }));
  }
}
