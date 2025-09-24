import { IsString, IsOptional, IsNumber, IsBoolean, IsUUID, IsEnum } from 'class-validator';
import { WarningStatus } from '@prisma/client';

export class CreateParticipantDto {
  @IsString()
  telegramId: string;

  @IsString()
  @IsOptional()
  username?: string;

  @IsString()
  firstName: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsNumber()
  @IsOptional()
  revenue?: number;

  @IsUUID()
  @IsOptional()
  gradeId?: string;

  @IsUUID()
  @IsOptional()
  userId?: string;
}

export class UpdateParticipantDto {
  @IsString()
  @IsOptional()
  telegramId?: string;

  @IsString()
  @IsOptional()
  username?: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsNumber()
  @IsOptional()
  revenue?: number;

  @IsUUID()
  @IsOptional()
  gradeId?: string;

  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  // Warning system fields
  @IsEnum(WarningStatus)
  @IsOptional()
  warningStatus?: WarningStatus | null;

  @IsNumber()
  @IsOptional()
  warningPeriodsLeft?: number;

  @IsNumber()
  @IsOptional()
  lastCompletionPercentage?: number;
}
