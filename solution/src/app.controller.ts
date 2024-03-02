import { Controller, Get } from '@nestjs/common';
import { Public } from './auth/decorators';

@Controller()
@Public()
export class AppController {
  @Get('ping')
  getHello(): string {
    return 'ok';
  }
}
