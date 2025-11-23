import { IsEmail, IsNotEmpty, IsOptional, IsString, IsBoolean, IsUUID } from 'class-validator';

export class CreateMemberDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsUUID()
  @IsNotEmpty()
  roleId: string;

  @IsUUID()
  @IsOptional() // Project ID có thể optional nếu thêm trực tiếp vào Tenant
  projectId?: string;

  // === CÁC TRƯỜNG BỔ SUNG CHO KHỚP GIAO DIỆN ===
  @IsString()
  @IsOptional()
  password?: string; // Cho phép nhập pass từ giao diện

  @IsBoolean()
  @IsOptional()
  isTenantAdmin?: boolean;

  @IsString()
  @IsOptional()
  status?: string;
}