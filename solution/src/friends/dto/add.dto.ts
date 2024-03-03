import { IsString } from 'class-validator';

export class AddDto {
  @IsString()
  login: string;
}
