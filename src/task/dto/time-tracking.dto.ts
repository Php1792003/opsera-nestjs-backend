import { IsString, IsNotEmpty, IsOptional, IsNumber, IsDateString } from 'class-validator';

export class TimeTrackingDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  duration: number; // in minutes

  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;
}
