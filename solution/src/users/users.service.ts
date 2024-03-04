import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
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
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

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

  private readonly userSelectWithId = { ...this.userSelect, id: true };

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
      const {
        country: { alpha2 },
        phone,
        image,
        ...user
      } = await this.prisma.user.create({
        data: {
          ...data,
          passwordHash,
          countryId: await this.getCountryIdOnCode(this.prisma, countryCode),
        },
        select: this.userSelect,
      });
      return this.userDbToType(user, phone, image, alpha2);
    } catch (e) {
      this.handleUserExceptions(e, countryCode);
    }
  }

  public async getMyProfile(userId: number): Promise<UserType> {
    const { country, phone, image, ...user } =
      await this.prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: this.userSelect,
      });
    return this.userDbToType(user, phone, image, country.alpha2);
  }

  public async updateMyProfile(userId: number, updateDto: UpdateDto) {
    const { countryCode, ...updates } = updateDto;
    try {
      let countryId: number | undefined = undefined;
      if (countryCode !== undefined)
        countryId = await this.getCountryIdOnCode(this.prisma, countryCode);
      const {
        country: { alpha2 },
        phone,
        image,
        ...user
      } = await this.prisma.user.update({
        where: { id: userId },
        data: { ...updates, countryId },
        select: this.userSelect,
      });
      return this.userDbToType(user, phone, image, alpha2);
    } catch (e) {
      this.handleUserExceptions(e, countryCode);
    }
  }

  public async getProfile(userId: number, login: string) {
    const foundUser = await this.prisma.user.findUnique({
      where: { login },
      select: {
        ...this.userSelectWithId,
        friendsAsA: { where: { bId: userId }, select: { aId: true } },
      },
    });
    if (
      foundUser === null ||
      (foundUser.id !== userId &&
        !foundUser.isPublic &&
        foundUser.friendsAsA.length < 1)
    )
      throw new HttpException(
        'No profile was found with the same username that you have access to',
        HttpStatus.FORBIDDEN,
      );
    const {
      country: { alpha2 },
      phone,
      image,
      id: foundId,
      friendsAsA,
      ...user
    } = foundUser;
    return this.userDbToType(user, phone, image, alpha2);
  }

  public async updatePassword(
    userId: number,
    oldPassword: string,
    newPassword: string,
  ) {
    try {
      await this.prisma.$transaction([
        this.prisma.user.update({
          where: {
            id: userId,
            passwordHash: await this.authService.hashPassword(oldPassword),
          },
          data: {
            passwordHash: await this.authService.hashPassword(newPassword),
          },
          select: { id: true },
        }),
        this.prisma.jWTToken.deleteMany({ where: { userId } }),
      ]);
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError) {
        if (e.code === 'P2025')
          throw new HttpException(
            'This password does not match the real one',
            HttpStatus.FORBIDDEN,
          );
      }
      throw e;
    }
  }
}
