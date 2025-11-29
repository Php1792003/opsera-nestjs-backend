import { IsNotEmpty, IsOptional, IsString, IsUUID, IsDateString, IsEnum, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateTaskDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsUUID()
  projectId: string;

  @IsOptional()
  @IsUUID()
  @Transform(({ value }) => (value === '' ? null : value)) // Quan trọng: Chuyển "" thành null
  assigneeId?: string | null;

  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => (value === '' ? null : value))
  deadline?: string | null;

  @IsOptional()
  @IsEnum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
  priority?: string;

  @IsOptional()
  tags?: any;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => (value === '' ? null : Number(value)))
  estimatedHours?: number;
}