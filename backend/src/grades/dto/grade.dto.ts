import { IsString, IsNumber, IsOptional, IsBoolean, Min, Max, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class PerformanceLevelDto {
  @IsNumber()
  @Min(0)
  @Max(200) // Увеличим до 200, чтобы поддерживать 110%, 120% и т.д.
  completionPercentage: number;

  @IsNumber()
  @Min(0)
  requiredRevenue: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  bonusPercentage: number;

  @IsNumber()
  @Min(0)
  bonus: number;

  @IsNumber()
  @Min(0)
  salary: number;

  @IsNumber()
  @Min(0)
  totalSalary: number;
}

export class CreateGradeDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  plan: number;

  @IsNumber()
  @Min(0)
  minRevenue: number;

  @IsNumber()
  @Min(0)
  maxRevenue: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PerformanceLevelDto)
  performanceLevels: PerformanceLevelDto[];

  @IsString()
  @IsOptional()
  color?: string;

  @IsNumber()
  @IsOptional()
  order?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateGradeDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  plan?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  minRevenue?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  maxRevenue?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PerformanceLevelDto)
  @IsOptional()
  performanceLevels?: PerformanceLevelDto[];

  @IsString()
  @IsOptional()
  color?: string;

  @IsNumber()
  @IsOptional()
  order?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
