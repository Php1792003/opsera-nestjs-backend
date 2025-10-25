import { Expose } from 'class-transformer';

export class ProfileDto {
  @Expose()
  userId: string;

  @Expose()
  tenantId: string;

  @Expose()
  isSuperAdmin: boolean;
}
