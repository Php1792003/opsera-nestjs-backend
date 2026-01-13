import { IsEmail, IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  @Matches(/^(?=.*[A-Z])(?=.*[\W_]).*$/, {
    message: 'Password must contain at least 1 uppercase letter and 1 special character',
  })
  password: string;

  @IsNotEmpty()
  @IsString()
  companyName: string; // Tên công ty/Tổ chức (Tenant)
}