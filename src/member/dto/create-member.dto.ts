import { IsEmail, IsNotEmpty, IsString, IsUUID } from 'class-validator';

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
}
