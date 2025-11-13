import { IsString, IsOptional, IsDateString, IsNumber } from 'class-validator';

export class TimeTrackingDto {
  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  startTime: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;

  @IsNumber()
  duration: number; // in minutes
}
