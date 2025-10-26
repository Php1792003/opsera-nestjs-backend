import { Exclude, Expose, Type } from 'class-transformer';
import { Permission } from '../constants/permissions.constant';

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

  @Exclude()
  permissionsStr: string;
}
