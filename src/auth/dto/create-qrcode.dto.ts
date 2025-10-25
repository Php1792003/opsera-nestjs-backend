import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateQrCodeDto {
  @IsString()
  @IsNotEmpty()
  name: string; // Tên thuộc tính là 'name'

  @IsString()
  @IsOptional()
  location?: string; // Tên thuộc tính là 'location'

  @IsString()
  @IsNotEmpty()
  projectId: string;
}
