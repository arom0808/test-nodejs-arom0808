import { IsBoolean, IsOptional, Matches, MaxLength } from 'class-validator';

export class UpdateDto {
  @IsOptional()
  @Matches('^[a-zA-Z]{2}$')
  countryCode?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @Matches('^\\+[\\d]+$')
  phone?: string;

  @IsOptional()
  @MaxLength(200)
  image?: string;
}
