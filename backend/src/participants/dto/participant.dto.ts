import { IsString, IsOptional, IsNumber, IsBoolean, IsUUID } from 'class-validator';

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
}
