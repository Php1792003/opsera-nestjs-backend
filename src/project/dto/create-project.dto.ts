import { IsNotEmpty, IsOptional, IsString, IsIn } from 'class-validator';

export class CreateProjectDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  @IsIn(['active', 'maintenance', 'inactive'])
  status?: string;

  @IsOptional()
  @IsString()
  image?: string;
}