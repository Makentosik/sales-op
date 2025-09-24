import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PeriodsService } from './periods.service';
import { CreatePeriodDto, UpdatePeriodDto, CompletePeriodDto } from './dto/period.dto';

@Controller('periods')
export class PeriodsController {
  constructor(private readonly periodsService: PeriodsService) {}

  @Post()
  create(@Body() createPeriodDto: CreatePeriodDto) {
    return this.periodsService.create(createPeriodDto);
  }

  @Get()
  findAll() {
    return this.periodsService.findAll();
  }

  @Get('current')
  getCurrentPeriod() {
    return this.periodsService.getCurrentPeriod();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.periodsService.findOne(id);
  }

  @Get(':id/stats')
  getPeriodStats(@Param('id') id: string) {
    return this.periodsService.getPeriodStats(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePeriodDto: UpdatePeriodDto) {
    return this.periodsService.update(id, updatePeriodDto);
  }

  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  activate(@Param('id') id: string) {
    return this.periodsService.activate(id);
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  complete(@Param('id') id: string, @Body() completePeriodDto: CompletePeriodDto) {
    return this.periodsService.complete(id, completePeriodDto);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  cancel(@Param('id') id: string) {
    return this.periodsService.cancel(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.periodsService.remove(id);
  }

  @Post('generate-name')
  @HttpCode(HttpStatus.OK)
  async generatePeriodName(@Body() data: { type: string; startDate: string }) {
    const name = await this.periodsService.generatePeriodName(
      data.type as any,
      new Date(data.startDate)
    );
    return { name };
  }

  @Get('test')
  test() {
    return { message: 'Periods controller is working!', timestamp: new Date().toISOString() };
  }
}