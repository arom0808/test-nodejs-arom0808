import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Request,
  ValidationPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { RegisterDto } from './dto/register.dto';
import { UserType } from './dto/user.dto';
import { Public } from '../auth/decorators';
import { UpdateDto } from './dto/update.dto';

@Controller()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post('/auth/register')
  @Public()
  async register(
    @Body(new ValidationPipe({ whitelist: true })) registerDto: RegisterDto,
  ): Promise<{ profile: UserType }> {
    try {
      return { profile: await this.usersService.register(registerDto) };
    } catch (e) {
      return { e: JSON.stringify(e) } as any;
    }
  }

  @Get('/me/profile')
  getMyProfile(@Request() { userId }: { userId: number }) {
    return this.usersService.getProfile(userId);
  }

  @Patch('/me/profile')
  updateMyProfile(
    @Request() { userId }: { userId: number },
    @Body(new ValidationPipe({ whitelist: true })) updateDto: UpdateDto,
  ) {
    return this.usersService.updateProfile(userId, updateDto);
  }
}
