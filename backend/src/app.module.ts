import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { GradesModule } from './grades/grades.module';
import { ParticipantsModule } from './participants/participants.module';
import { PeriodsModule } from './periods/periods.module';
import { GradeTransitionsModule } from './grade-transitions/grade-transitions.module';
import { SalaryCalculatorModule } from './salary-calculator/salary-calculator.module';
import { LogsModule } from './logs';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsersModule,
    AuthModule,
    GradesModule,
    ParticipantsModule,
    PeriodsModule,
    GradeTransitionsModule,
    SalaryCalculatorModule,
    LogsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
