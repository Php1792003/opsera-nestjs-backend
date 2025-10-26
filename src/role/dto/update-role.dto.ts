import { IsOptional, IsString, IsArray, IsEnum } from 'class-validator';
import { Permission } from '../constants/permissions.constant';

export class UpdateRoleDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsArray()
  @IsEnum(Permission, { each: true })
  @IsOptional()
  permissions?: Permission[];
}
