import {
  Controller,
  DefaultValuePipe,
  Get,
  HttpException,
  HttpStatus,
  Param,
  ParseArrayPipe,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { GetByAlpha2Dto } from './dto/get-by-alpha2.dto';
import { RegionsPipe } from './pipe/regions.pipe';
import { RegionEnum } from './regions-enum.type';
import { CountriesService } from './countries.service';
import { Public } from '../auth/decorators';

@Controller('countries')
@Public()
export class CountriesController {
  constructor(private countriesService: CountriesService) {}

  @Get()
  getAll(
    @Query('region', new DefaultValuePipe([]), ParseArrayPipe, RegionsPipe)
    region: RegionEnum[],
  ) {
    return this.countriesService.getAll(region);
  }

  @Get(':alpha2')
  async getByAlpha2(@Param(ValidationPipe) { alpha2 }: GetByAlpha2Dto) {
    const country = await this.countriesService.getByAlpha2(alpha2);
    if (country !== null) return country;
    throw new HttpException(
      `There is no country with alpha2 code '${alpha2}'!`,
      HttpStatus.NOT_FOUND,
    );
  }
}
