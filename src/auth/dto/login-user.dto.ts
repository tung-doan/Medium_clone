import { IsString, Length } from 'class-validator';


export class LoginDto {

  @IsString()
  @Length(1, 20)
  username: string;

  @IsString()
  @Length(4, 20)
  password: string;
}