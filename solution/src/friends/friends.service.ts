import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { rfc3339 } from '../common/rfc3339';

@Injectable()
export class FriendsService {
  constructor(private prisma: PrismaService) {}

  public async addFriend(userId: number, login: string) {
    try {
      const assignedAt = new Date();
      const { id: friendId } = await this.prisma.user.findUniqueOrThrow({
        where: { login },
        select: { id: true },
      });
      await this.prisma.friend.upsert({
        where: { aId_bId: { aId: userId, bId: friendId } },
        create: { aId: userId, bId: friendId, assignedAt },
        update: { assignedAt },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2025')
          throw new HttpException(
            'No user with this login found',
            HttpStatus.NOT_FOUND,
          );
      }
      throw e;
    }
  }

  public async removeFriend(userId: number, login: string) {
    await this.prisma.friend.deleteMany({
      where: { aId: userId, B: { login } },
    });
  }

  public async getFriends(userId: number, limit: number, offset: number) {
    const friends = await this.prisma.friend.findMany({
      where: { aId: userId },
      select: { assignedAt: true, B: { select: { login: true } } },
      skip: offset,
      take: limit,
      orderBy: { assignedAt: 'desc' },
    });
    return friends.map((v) => {
      return { login: v.B.login, addedAt: rfc3339(v.assignedAt) };
    });
  }
}
