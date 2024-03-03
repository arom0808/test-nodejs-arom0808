import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class UpdatePasswordDto {
  @IsString()
  oldPassword: string;

  @MinLength(6)
  @MaxLength(100)
  @Matches('^.*[0-9].*$')
  @Matches('^.*[a-z].*$')
  @Matches('^.*[A-Z].*$')
  newPassword: string;
}
