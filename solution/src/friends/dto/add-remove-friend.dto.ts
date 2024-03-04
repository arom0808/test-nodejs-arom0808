import { IsString } from 'class-validator';

export class AddRemoveFriendDto {
  @IsString()
  login: string;
}
