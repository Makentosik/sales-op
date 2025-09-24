import { Module } from '@nestjs/common';
import { SalaryCalculatorService } from './salary-calculator.service';
import { SalaryCalculatorController } from './salary-calculator.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PeriodsModule } from '../periods/periods.module';

@Module({
  imports: [PrismaModule, PeriodsModule],
  controllers: [SalaryCalculatorController],
  providers: [SalaryCalculatorService],
  exports: [SalaryCalculatorService],
})
export class SalaryCalculatorModule {}