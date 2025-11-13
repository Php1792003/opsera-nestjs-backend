import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

export class CreateScanDto {
  @IsString()
  @IsNotEmpty()
  qrCodeData: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @IsUrl({}, { each: true })
  @IsOptional()
  attachments?: string[];
}
