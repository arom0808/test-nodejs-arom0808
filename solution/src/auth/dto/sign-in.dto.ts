import { Matches, MaxLength, MinLength } from 'class-validator';

export class SignInDto {
  @MaxLength(30)
  @Matches('^[a-zA-Z0-9-]+$')
  login: string;

  @MinLength(6)
  @MaxLength(100)
  @Matches('^.*[0-9].*$')
  @Matches('^.*[a-z].*$')
  @Matches('^.*[A-Z].*$')
  password: string;
}
