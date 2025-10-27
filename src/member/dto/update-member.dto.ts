import { IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateMemberDto {
  @IsString()
  @IsOptional()
  fullName?: string;

  @IsUUID()
  @IsOptional()
  roleId?: string;
}
