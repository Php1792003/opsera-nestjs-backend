import { IsNotEmpty, IsString, IsArray, IsEnum, IsUUID, IsOptional } from 'class-validator';
import { Permission } from '../constants/permissions.constant';

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @IsEnum(Permission, { each: true })
  permissions: Permission[];

  @IsOptional()
  @IsUUID()
  projectId?: string;
}
