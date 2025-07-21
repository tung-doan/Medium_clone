import { IsString, IsEmail, IsOptional, Length, IsNumber, IsUrl } from 'class-validator';

export class UpdateUserDto {
  @IsNumber()
  id: number;
    
  @IsOptional()
  @IsString()
  @Length(1, 45)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(1, 20)
  username?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Length(4, 20)
  password?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  @IsUrl()
  image?: string;
}