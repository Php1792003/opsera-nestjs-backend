// src/role/dto/role-response.dto.ts

import { Exclude, Expose, Type } from 'class-transformer';
import { Permission } from '../constants/permissions.constant';
import { IsOptional } from 'class-validator';

class UserBasicInfoDto {
  @Expose()
  id: string;

  @Expose()
  email: string;

  @Expose()
  fullName: string;

  @Expose()
  createdAt: Date;
}

class RoleUserCountDto {
  @Expose()
  users: number;
}

export class RoleResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  permissions: Permission[];

  @Expose()
  tenantId: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  @Type(() => RoleUserCountDto)
  _count: RoleUserCountDto;

  @Expose()
  @Type(() => UserBasicInfoDto)
  @IsOptional()
  users?: UserBasicInfoDto[];

  @Exclude()
  permissionsStr: string;
}
