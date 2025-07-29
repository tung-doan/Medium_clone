import { IsString, IsOptional, IsArray, Length, IsNotEmpty, IsBoolean } from 'class-validator';

export class UpdateArticleDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  title?: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  body?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Length(1, 50, { each: true })
  tagList?: string[];

  @IsOptional()
  @IsBoolean()
  isDraft?: boolean;

  //field for internal use (not validated from API)
  slug?: string;
}