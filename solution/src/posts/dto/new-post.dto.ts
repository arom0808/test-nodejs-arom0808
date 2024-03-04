import { IsArray, IsString, MaxLength } from 'class-validator';

export class NewPostDto {
  @IsString()
  @MaxLength(1000)
  content: string;

  @IsArray()
  @IsString({ each: true })
  @MaxLength(20, { each: true })
  tags: string[];
}
