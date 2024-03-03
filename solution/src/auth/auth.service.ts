import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { hashConstants, jwtConstants } from './constants';
import { WrongLoginOrPasswordException } from './exceptions';
import { ConfigService } from '@nestjs/config';

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
    const { jwtId, userId } = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { login },
        select: { passwordHash: true, id: true },
      });
      if (
        user === null ||
        !(await this.isPasswordMatch(password, user.passwordHash))
      )
        throw new WrongLoginOrPasswordException();
      const { id: jwtId } = await tx.jWTToken.create({
        data: { expiresIn },
        select: { id: true },
      });
      return { jwtId, userId: user.id };
    });
    const token = await this.jwtService.signAsync(
      { exp: Math.floor(expiresIn.getTime() / 1000), userId, jti: jwtId },
      { noTimestamp: true, secret: this.jwt_secret },
    );
    return { token };
  }
}
