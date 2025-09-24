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
import { GradesService } from './grades.service';
import { CreateGradeDto, UpdateGradeDto } from './dto/grade.dto';

@Controller('grades')
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Get()
  findAll() {
    return this.gradesService.findAll();
  }

  @Get('stats')
  getStats() {
    return this.gradesService.getGradeStats();
  }

  @Get('by-revenue')
  getByRevenue(@Query('revenue') revenue: string) {
    const revenueNumber = parseFloat(revenue);
    if (isNaN(revenueNumber)) {
      throw new Error('Revenue must be a valid number');
    }
    return this.gradesService.getGradeByRevenue(revenueNumber);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.gradesService.findOne(id);
  }

  @Post()
  create(@Body(ValidationPipe) createGradeDto: CreateGradeDto) {
    return this.gradesService.create(createGradeDto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateGradeDto: UpdateGradeDto,
  ) {
    return this.gradesService.update(id, updateGradeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.gradesService.remove(id);
  }
}