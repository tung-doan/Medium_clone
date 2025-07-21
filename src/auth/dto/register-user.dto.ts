import { IsString, Length, IsEmail, IsUrl, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsString()
  @Length(1, 20)
  username: string;

  @IsString()
  @Length(4, 20)
  password: string;

  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  @IsUrl()
  image?: string;
}
