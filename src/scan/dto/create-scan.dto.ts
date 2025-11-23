import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateScanDto {
  @IsNotEmpty()
  @IsString()
  qrCodeData: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  attachments?: any;
}