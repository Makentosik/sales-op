import { IsOptional, IsString, IsEnum, IsBoolean, IsBooleanString } from 'class-validator';
import { Transform } from 'class-transformer';

export enum SortField {
  NAME = 'name',
  REVENUE = 'revenue',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export enum WarningStatusFilter {
  WARNING_90 = 'WARNING_90',
  WARNING_80 = 'WARNING_80',
  NO_WARNING = 'NO_WARNING',
}

export class FilterParticipantsDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  gradeId?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsEnum(WarningStatusFilter)
  warningStatus?: WarningStatusFilter;

  @IsOptional()
  @IsEnum(SortField)
  sortBy?: SortField = SortField.CREATED_AT;

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  includeGrade?: boolean = true;
}