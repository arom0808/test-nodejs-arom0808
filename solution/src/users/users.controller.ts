import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
import { UpdatePasswordDto } from './dto/update-password.dto';

@Controller()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post('/auth/register')
  @Public()
  async register(
    @Body(new ValidationPipe({ whitelist: true })) registerDto: RegisterDto,
  ): Promise<{ profile: UserType }> {
    return { profile: await this.usersService.register(registerDto) };
  }

  @Get('/me/profile')
  getMyProfile(@Request() { userId }: { userId: number }) {
    return this.usersService.getMyProfile(userId);
  }

  @Patch('/me/profile')
  updateMyProfile(
    @Request() { userId }: { userId: number },
    @Body(new ValidationPipe({ whitelist: true })) updateDto: UpdateDto,
  ) {
    return this.usersService.updateMyProfile(userId, updateDto);
  }

  @Get('/profiles/:login')
  async getProfile(
    @Request() { userId }: { userId: number },
    @Param() { login }: { login: string },
  ) {
    return await this.usersService.getProfile(userId, login);
  }

  @Post('/me/updatePassword')
  @HttpCode(HttpStatus.OK)
  async updatePassword(
    @Request() { userId }: { userId: number },
    @Body(new ValidationPipe()) { oldPassword, newPassword }: UpdatePasswordDto,
  ) {
    await this.usersService.updatePassword(userId, oldPassword, newPassword);
    return { status: 'ok' };
  }
}
