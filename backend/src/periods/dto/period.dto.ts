import { IsString, IsDateString, IsEnum, IsOptional, IsBoolean } from 'class-validator';

export enum PeriodType {
  MONTHLY = 'MONTHLY',
  TEN_DAYS = 'TEN_DAYS',
  CUSTOM = 'CUSTOM',
}

export enum PeriodStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE', 
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export class CreatePeriodDto {
  @IsString()
  name: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsEnum(PeriodType)
  type: PeriodType;
}

export class UpdatePeriodDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsEnum(PeriodType)
  @IsOptional()
  type?: PeriodType;

  @IsEnum(PeriodStatus)
  @IsOptional()
  status?: PeriodStatus;
}

export class CompletePeriodDto {
  @IsBoolean()
  @IsOptional()
  saveSnapshot?: boolean = true; // По умолчанию сохраняем снимок данных
}