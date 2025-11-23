import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateScanDto {
  @IsNotEmpty()
  @IsString()
  qrCodeData: string; // Dữ liệu quét được từ QR

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  location?: string; // "10.123, 106.456" hoặc địa chỉ text

  @IsOptional()
  @IsString()
  status?: string; // VALID, INVALID

  @IsOptional()
  attachments?: any;
}