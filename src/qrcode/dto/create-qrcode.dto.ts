import { IsNotEmpty, IsString, IsUUID, IsOptional } from 'class-validator';

export class CreateQrCodeDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsNotEmpty()
  @IsUUID()
  projectId: string;
}