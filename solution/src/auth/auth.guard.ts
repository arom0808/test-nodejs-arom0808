import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { JsonWebTokenError, JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { InvalidJWTFormatException } from './exceptions';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './decorators';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly jwt_secret: string;

  constructor(
    private jwtService: JwtService,
    private prismaService: PrismaService,
    private reflector: Reflector,
    configService: ConfigService,
  ) {
    this.jwt_secret = configService.get('RANDOM_SECRET');
    if (typeof this.jwt_secret !== 'string')
      throw new Error('Invalid RANDOM_SECRET env');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token)
      throw new HttpException(
        'No bearer token in the header!',
        HttpStatus.UNAUTHORIZED,
      );
    try {
      const clock = new Date();
      const payload = await this.jwtService.verifyAsync(token, {
        clockTimestamp: Math.floor(clock.getTime() / 1000),
        secret: this.jwt_secret,
      });
      if (
        typeof payload !== 'object' ||
        payload === null ||
        typeof payload.userId !== 'number' ||
        typeof payload.jti !== 'number'
      )
        throw new InvalidJWTFormatException();
      await this.prismaService.jWTToken.findUniqueOrThrow({
        where: {
          id: payload.jti,
          expiresIn: { gte: clock },
          userId: payload.userId,
        },
        select: { id: true },
      });
      request['userId'] = payload.userId;
    } catch (e) {
      if (e instanceof JsonWebTokenError)
        throw new HttpException(e.message, HttpStatus.UNAUTHORIZED);
      if (e instanceof InvalidJWTFormatException)
        throw new HttpException(
          'jwt has invalid fields',
          HttpStatus.UNAUTHORIZED,
        );
      if (e instanceof PrismaClientKnownRequestError && e.code === 'P2025')
        throw new HttpException('jwt has expired', HttpStatus.UNAUTHORIZED);
      throw new HttpException(
        'Some authorization error',
        HttpStatus.UNAUTHORIZED,
      );
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
