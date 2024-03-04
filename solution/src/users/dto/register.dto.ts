import {
  IsBoolean,
  IsEmail,
  IsOptional,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @MaxLength(30)
  @Matches('^[a-zA-Z0-9-]+$')
  login: string;

  @MinLength(1)
  @MaxLength(50)
  @IsEmail()
  email: string;

  @MinLength(6)
  @MaxLength(100)
  @Matches('^.*[0-9].*$')
  @Matches('^.*[a-z].*$')
  @Matches('^.*[A-Z].*$')
  password: string;

  @Matches('^[a-zA-Z]{2}$')
  countryCode: string;

  @IsBoolean()
  isPublic: boolean;

  @IsOptional()
  @Matches('^\\+[\\d]+$')
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @MaxLength(200)
  image?: string;
}
