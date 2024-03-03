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

  public async getProfile(userId: number, login: string) {
    const foundUser = await this.prisma.user.findUnique({
      where: { login },
      select: this.userSelectWithId,
    });
    if (foundUser === null)
      throw new HttpException(
        'No profile with this login was found',
        HttpStatus.FORBIDDEN,
      );
    const { country, phone, image, id: foundId, ...user } = foundUser;
    if (user.isPublic || userId === foundId)
      return this.userDbToType(user, phone, image, country.alpha2);
    const is_friend = await this.prisma.friend.findUnique({
      where: { aId_bId: { aId: userId, bId: foundId } },
      select: { aId: true },
    });
    if (is_friend !== null)
      return this.userDbToType(user, phone, image, country.alpha2);
    throw new HttpException(
      'You do not have access to this profile',
      HttpStatus.FORBIDDEN,
    );
  }

  public async updatePassword(
    userId: number,
    oldPassword: string,
    newPassword: string,
  ) {
    const { passwordHash: oldPasswordHash } =
      await this.prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { passwordHash: true },
      });
    if (!(await this.authService.isPasswordMatch(oldPassword, oldPasswordHash)))
      throw new HttpException(
        'This password does not match the real one',
        HttpStatus.FORBIDDEN,
      );
    const passwordHash = await this.authService.hashPassword(newPassword);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
        select: { id: true },
      }),
      this.prisma.jWTToken.deleteMany({ where: { userId } }),
    ]);
  }
}
