import { IsNotEmpty, IsString, IsOptional, IsArray } from 'class-validator';

export class CreateScanDto {
  @IsNotEmpty()
  @IsString()
  qrCodeData: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  issueDescription?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}