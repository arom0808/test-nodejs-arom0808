import { Injectable } from '@nestjs/common';
import { RegionEnum } from './regions-enum.type';
import { PrismaService } from '../prisma/prisma.service';
import { CountryType } from './dto/country.dto';

@Injectable()
export class CountriesService {
  constructor(private prisma: PrismaService) {}

  public getAll(region: RegionEnum[]): Promise<CountryType[]> {
    if (region.length > 0)
      return this.prisma.countries.findMany({
        where: { region: { in: region } },
        select: { name: true, alpha2: true, alpha3: true, region: true },
        orderBy: { alpha2: 'asc' },
      });
    return this.prisma.countries.findMany({
      select: { name: true, alpha2: true, alpha3: true, region: true },
      orderBy: { alpha2: 'asc' },
    });
  }

  public getByAlpha2(alpha2: string): Promise<CountryType | null> {
    return this.prisma.countries.findFirst({
      where: { alpha2: { equals: alpha2 } },
      select: { name: true, alpha2: true, alpha3: true, region: true },
    });
  }
}
