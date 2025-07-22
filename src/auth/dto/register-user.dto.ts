import { IsString, Length, IsEmail } from 'class-validator';

export class RegisterDto {
  @IsString()
  @Length(1, 20)
  username: string;

  @IsString()
  @Length(4, 20)
  password: string;

  @IsString()
  @Length(1, 45)
  name?: string;

  @IsEmail()
  email: string;
}
