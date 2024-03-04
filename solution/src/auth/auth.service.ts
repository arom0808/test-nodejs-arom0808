import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { hashConstants, jwtConstants } from './constants';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { WrongLoginOrPasswordException } from './exceptions';

@Injectable()
export class AuthService {
  private readonly jwt_secret: string;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    configService: ConfigService,
  ) {
    this.jwt_secret = configService.get('RANDOM_SECRET');
    if (typeof this.jwt_secret !== 'string')
      throw new Error('Invalid RANDOM_SECRET env');
    setInterval(() => {
      this.clearTokensDB();
    }, jwtConstants.clearTimeout);
  }

  private clearTokensDB() {
    this.prisma.jWTToken
      .deleteMany({
        where: { expiresIn: { lt: new Date() } },
      })
      .catch((e) => {
        throw e;
      });
  }

  public hashPassword(password: string) {
    return bcrypt.hash(password, hashConstants.salt);
  }

  public isPasswordMatch(password: string, hash: string) {
    return bcrypt.compare(password, hash);
  }

  public async signIn(
    login: string,
    password: string,
  ): Promise<{ token: string }> {
    const expiresIn = new Date(Date.now() + jwtConstants.expiresIn);
    try {
      const [{ id: userId }, { id: jwtId }] = await this.prisma.$transaction([
        this.prisma.user.findUniqueOrThrow({
          where: { login, passwordHash: await this.hashPassword(password) },
          select: { id: true },
        }),
        this.prisma.jWTToken.create({
          data: { expiresIn, user: { connect: { login } } },
          select: { id: true },
        }),
      ]);
      const token = await this.jwtService.signAsync(
        { exp: Math.floor(expiresIn.getTime() / 1000), userId, jti: jwtId },
        { noTimestamp: true, secret: this.jwt_secret },
      );
      return { token };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2025') throw new WrongLoginOrPasswordException();
      }
      throw e;
    }
  }
}
