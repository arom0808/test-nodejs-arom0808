import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  ValidationPipe,
} from '@nestjs/common';
import { SignInDto } from './dto/sign-in.dto';
import { AuthService } from './auth.service';
import { Public } from './decorators';

@Controller('auth')
@Public()
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('sign-in')
  @HttpCode(HttpStatus.OK)
  signIn(@Body(ValidationPipe) { login, password }: SignInDto) {
    return this.authService.signIn(login, password);
  }

  // @Post('check')
  // @UseGuards(AuthGuard)
  // check(@Request() { userId }: { userId: number }, @Body() body) {
  //   console.log(userId);
  //   console.log(body);
  // }
}
