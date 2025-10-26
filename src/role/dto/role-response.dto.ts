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
  permissions: Permission[]; // Trả về dưới dạng mảng

  @Expose()
  tenantId: string;

  @Expose()
  createdAt: Date;
  
  @Expose()
  updatedAt: Date;

  @Expose()
  @Type(() => RoleUserCountDto)
  _count: RoleUserCountDto;

  // Chúng ta ẩn trường permissions gốc (dạng string) đi
  @Exclude()
  permissionsStr: string;
}