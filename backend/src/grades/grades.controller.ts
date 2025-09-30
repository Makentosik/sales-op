import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ValidationPipe,
  Query,
} from '@nestjs/common';
import { GradesService, Grade } from './grades.service';
import { CreateGradeDto, UpdateGradeDto } from './dto/grade.dto';
import { Public } from '../auth/public.decorator';

@Controller('grades')
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Get()
  @Public()
  findAll(): Promise<Grade[]> {
    return this.gradesService.findAll();
  }

  @Get('stats')
  getStats() {
    return this.gradesService.getGradeStats();
  }

  @Get('by-revenue')
  getByRevenue(@Query('revenue') revenue: string): Promise<Grade | null> {
    const revenueNumber = parseFloat(revenue);
    if (isNaN(revenueNumber)) {
      throw new Error('Revenue must be a valid number');
    }
    return this.gradesService.getGradeByRevenue(revenueNumber);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Grade> {
    return this.gradesService.findOne(id);
  }

  @Post()
  create(@Body(ValidationPipe) createGradeDto: CreateGradeDto): Promise<Grade> {
    return this.gradesService.create(createGradeDto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateGradeDto: UpdateGradeDto,
  ): Promise<Grade> {
    return this.gradesService.update(id, updateGradeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<Grade> {
    return this.gradesService.remove(id);
  }
}