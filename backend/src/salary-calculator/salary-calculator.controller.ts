import { Controller, Get, Param, Query } from '@nestjs/common';
import { SalaryCalculatorService } from './salary-calculator.service';
import { SalaryCalculationResponse, ParticipantSalaryDetailsResponse } from './salary-calculator.types';

@Controller('salary-calculator')
export class SalaryCalculatorController {
  constructor(private readonly salaryCalculatorService: SalaryCalculatorService) {}

  /**
   * Получить расчет зарплат для всех участников
   */
  @Get('calculate')
  async calculateSalaries(@Query('periodId') periodId?: string): Promise<SalaryCalculationResponse> {
    return this.salaryCalculatorService.calculateSalaries(periodId);
  }

  /**
   * Получить детальный расчет для конкретного участника
   */
  @Get('participant/:participantId')
  async getParticipantSalaryDetails(@Param('participantId') participantId: string): Promise<ParticipantSalaryDetailsResponse> {
    return this.salaryCalculatorService.getParticipantSalaryDetails(participantId);
  }
}