import { Module } from '@nestjs/common';
import { PeriodsService } from './periods.service';
import { PeriodsController } from './periods.controller';
import { PrismaService } from '../prisma/prisma.service';
import { GradeTransitionsModule } from '../grade-transitions/grade-transitions.module';

@Module({
  imports: [GradeTransitionsModule],
  controllers: [PeriodsController],
  providers: [PeriodsService, PrismaService],
  exports: [PeriodsService],
})
export class PeriodsModule {}
