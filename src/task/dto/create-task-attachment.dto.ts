import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateTaskAttachmentDto {
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsString()
  @IsNotEmpty()
  fileUrl: string;

  @IsOptional()
  @IsString()
  description?: string;
}
