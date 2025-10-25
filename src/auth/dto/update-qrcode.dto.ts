import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class UpdateQrCodeDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  projectId?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
