import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  Post,
  Query,
  Request,
  ValidationPipe,
} from '@nestjs/common';
import { AddDto } from './dto/add.dto';
import { FriendsService } from './friends.service';
import { MinMaxPipe } from '../common/pipe/min-max.pipe';

@Controller('friends')
export class FriendsController {
  constructor(private friendsService: FriendsService) {}

  @Post('add')
  @HttpCode(HttpStatus.OK)
  async addFriend(
    @Request() { userId }: { userId: number },
    @Body(ValidationPipe) { login }: AddDto,
  ) {
    await this.friendsService.addFriend(userId, login);
    return { status: 'ok' };
  }

  @Post('remove')
  @HttpCode(HttpStatus.OK)
  async removeFriend(
    @Request() { userId }: { userId: number },
    @Body(ValidationPipe) { login }: AddDto,
  ) {
    await this.friendsService.removeFriend(userId, login);
    return { status: 'ok' };
  }

  @Get()
  async getFriends(
    @Request() { userId }: { userId: number },
    @Query(
      'limit',
      new DefaultValuePipe(5),
      ParseIntPipe,
      new MinMaxPipe({ min: 0, max: 50 }),
    )
    limit: number,
    @Query(
      'offset',
      new DefaultValuePipe(0),
      ParseIntPipe,
      new MinMaxPipe({ min: 0 }),
    )
    offset: number,
  ) {
    return this.friendsService.getFriends(userId, limit, offset);
  }
}
