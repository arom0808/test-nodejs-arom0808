import { Matches } from 'class-validator';

export class GetByAlpha2Dto {
  @Matches('^[a-zA-Z]{2}$')
  alpha2: string;
}
