import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserType } from './dto/user.dto';
import { RegisterDto } from './dto/register.dto';
import { Prisma } from '@prisma/client';
import {
  EqualUniqueFieldException,
  NoCountryWasFoundException,
} from '../auth/exceptions';
import { AuthService } from '../auth/auth.service';
import { UpdateDto } from './dto/update.dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
  ) {}

  private readonly userSelect = {
    login: true,
    email: true,
    isPublic: true,
    phone: true,
    image: true,
    country: { select: { alpha2: true } },
  };

  private userDbToType(
    user: Pick<UserType, 'login' | 'email' | 'isPublic'>,
    phone: string | null,
    image: string | null,
    countryCode: string,
  ) {
    return {
      ...user,
      phone: phone ?? undefined,
      image: image ?? undefined,
      countryCode,
    };
  }

  private handleUserExceptions(e: any, countryCode: string) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2025') throw new NoCountryWasFoundException(countryCode);
      if (e.code === 'P2002')
        throw new EqualUniqueFieldException(e?.meta?.target);
    }
    throw e;
  }

  private async getCountryIdOnCode(
    tx: any,
    countryCode: string,
  ): Promise<number> {
    return (
      await tx.countries.findFirstOrThrow({
        where: { alpha2: countryCode },
        select: { id: true },
      })
    ).id;
  }

  public async register(registerDto: RegisterDto) {
    const { countryCode, password, ...data } = registerDto;
    const passwordHash = await this.authService.hashPassword(password);
    try {
      const { country, phone, image, ...user } = await this.prisma.$transaction(
        async (tx) => {
          return tx.user.create({
            data: {
              ...data,
              passwordHash,
              countryId: await this.getCountryIdOnCode(tx, countryCode),
            },
            select: this.userSelect,
          });
        },
      );
      return this.userDbToType(user, phone, image, country.alpha2);
    } catch (e) {
      this.handleUserExceptions(e, countryCode);
    }
  }

  public async getProfile(userId: number): Promise<UserType> {
    const { country, phone, image, ...user } =
      await this.prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: this.userSelect,
      });
    return this.userDbToType(user, phone, image, country.alpha2);
  }

  public async updateProfile(userId: number, updateDto: UpdateDto) {
    const { countryCode, ...updates } = updateDto;
    try {
      const { country, phone, image, ...user } = await this.prisma.$transaction(
        async (tx) => {
          let countryId: number | undefined = undefined;
          if (countryCode !== undefined)
            countryId = await this.getCountryIdOnCode(tx, countryCode);
          return tx.user.update({
            where: { id: userId },
            data: { ...updates, countryId },
            select: this.userSelect,
          });
        },
      );
      return this.userDbToType(user, phone, image, country.alpha2);
    } catch (e) {
      this.handleUserExceptions(e, countryCode);
    }
  }
}
