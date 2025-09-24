import { IsString, IsOptional, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class ImportParticipantDto {
  @IsString()
  @IsOptional()
  grade?: string;

  @IsString()
  name: string;

  @IsNumber()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return parseFloat(value);
    }
    return value;
  })
  revenue: number;
}

export class ImportParticipantsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportParticipantDto)
  participants: ImportParticipantDto[];
}