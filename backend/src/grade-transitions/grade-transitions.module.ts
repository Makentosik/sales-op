import { Module } from '@nestjs/common';
import { GradeTransitionsService } from './grade-transitions.service';
import { GradeTransitionsController } from './grade-transitions.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [GradeTransitionsController],
  providers: [GradeTransitionsService],
  exports: [GradeTransitionsService],
})
export class GradeTransitionsModule {}