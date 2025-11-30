import { IsEmail, IsNotEmpty, IsOptional, IsString, IsBoolean } from 'class-validator';

export class CreateMemberDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsString()
  @IsNotEmpty()
  roleId: string;

  @IsString()
  @IsOptional()
  tenantId?: string;

  @IsString()
  @IsOptional()
  projectId?: string;

  @IsBoolean()
  @IsOptional()
  isTenantAdmin?: boolean;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  avatar?: string;
}