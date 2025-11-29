import { PartialType } from '@nestjs/mapped-types';
import { CreateTaskDto } from './create-task.dto';
import { IsOptional, IsUUID, IsDateString, IsEnum, IsNumber, IsString, IsArray } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  @IsUUID()
  @Transform(({ value }) => (value === '' ? null : value))
  assigneeId?: string | null;

  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => (value === '' ? null : value))
  deadline?: string | null;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  priority?: string;

  @IsOptional()
  @IsArray()
  tags?: string[];

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => (value === '' ? null : Number(value)))
  estimatedHours?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => (value === '' ? null : Number(value)))
  actualHours?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}