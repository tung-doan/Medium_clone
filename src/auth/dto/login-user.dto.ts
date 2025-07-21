import { IsString, Length, IsEmail } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(4, 20)
  password: string;
}
