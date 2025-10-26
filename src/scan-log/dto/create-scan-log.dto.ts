import { IsNotEmpty, IsOptional, IsString, IsNumber, IsArray } from 'class-validator';

export class CreateScanLogDto {
  @IsString()
  @IsNotEmpty()
  qrCodeId: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  attachments?: string[]; // URLs của ảnh đính kèm

  // GPS Location
  @IsNumber()
  @IsNotEmpty()
  latitude: number; // Vĩ độ

  @IsNumber()
  @IsNotEmpty()
  longitude: number; // Kinh độ

  @IsNumber()
  @IsOptional()
  accuracy?: number; // Độ chính xác GPS (meters)
}
