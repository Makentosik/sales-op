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
  ParseBoolPipe,
} from '@nestjs/common';
import { ParticipantsService } from './participants.service';
import { CreateParticipantDto, UpdateParticipantDto } from './dto/participant.dto';
import { ImportParticipantDto, ImportParticipantsDto } from './dto/import-participant.dto';
import { Public } from '../auth/public.decorator';

@Controller('participants')
export class ParticipantsController {
  constructor(private readonly participantsService: ParticipantsService) {}

  @Get()
  findAll(@Query('includeGrade', new ParseBoolPipe({ optional: true })) includeGrade: boolean) {
    return this.participantsService.findAll(includeGrade);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.participantsService.findOne(id);
  }

  @Post()
  create(@Body(ValidationPipe) createParticipantDto: CreateParticipantDto) {
    return this.participantsService.create(createParticipantDto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateParticipantDto: UpdateParticipantDto,
  ) {
    return this.participantsService.update(id, updateParticipantDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.participantsService.remove(id);
  }

  @Post('import')
  @Public()
  async import(@Body(ValidationPipe) data: ImportParticipantsDto | ImportParticipantDto[]) {
    // Поддерживаем оба формата: массив и объект с полем participants
    const participants = Array.isArray(data) ? data : data.participants;
    return this.participantsService.importParticipants(participants);
  }

  @Post('import-single')
  async importSingle(@Body(ValidationPipe) data: ImportParticipantDto) {
    // Импорт одного участника
    const result = await this.participantsService.importParticipants([data]);
    return {
      success: result.errors.length === 0,
      ...result
    };
  }
}
