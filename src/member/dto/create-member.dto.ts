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
  @IsNotEmpty()
  tenantId: string; // Thường lấy từ token, nhưng nếu DTO có thì cứ để

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