import { Controller, Get, Param, Query } from '@nestjs/common';
import { GradeTransitionsService } from './grade-transitions.service';

@Controller('grade-transitions')
export class GradeTransitionsController {
  constructor(private readonly gradeTransitionsService: GradeTransitionsService) {}

  /**
   * Получить историю переходов для участника
   */
  @Get('participant/:participantId')
  async getParticipantTransitions(@Param('participantId') participantId: string) {
    return this.gradeTransitionsService.getParticipantTransitions(participantId);
  }

  /**
   * Получить всех участников с предупреждениями
   */
  @Get('warnings')
  async getParticipantsWithWarnings() {
    return this.gradeTransitionsService.getParticipantsWithWarnings();
  }
}