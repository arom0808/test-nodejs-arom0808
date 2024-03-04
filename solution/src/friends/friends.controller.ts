import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  ValidationPipe,
} from '@nestjs/common';
import { AddRemoveFriendDto } from './dto/add-remove-friend.dto';
import { FriendsService } from './friends.service';
import {
  PaginationLimit,
  PaginationOffset,
} from '../common/decorators/limit.decorator';

@Controller('friends')
export class FriendsController {
  constructor(private friendsService: FriendsService) {}

  @Post('add')
  @HttpCode(HttpStatus.OK)
  async addFriend(
    @Request() { userId }: { userId: number },
    @Body(ValidationPipe) { login }: AddRemoveFriendDto,
  ) {
    await this.friendsService.addFriend(userId, login);
    return { status: 'ok' };
  }

  @Post('remove')
  @HttpCode(HttpStatus.OK)
  async removeFriend(
    @Request() { userId }: { userId: number },
    @Body(ValidationPipe) { login }: AddRemoveFriendDto,
  ) {
    await this.friendsService.removeFriend(userId, login);
    return { status: 'ok' };
  }

  @Get()
  async getFriends(
    @Request() { userId }: { userId: number },
    @PaginationLimit() limit: number,
    @PaginationOffset() offset: number,
  ) {
    return this.friendsService.getFriends(userId, limit, offset);
  }
}
