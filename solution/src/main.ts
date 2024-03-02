import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './http.exception-filter';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma/prisma.service';
import * as util from 'util';
import * as child from 'child_process';

async function bootstrap() {
  const exec = util.promisify(child.exec);
  try {
    await exec('sh ./my-init-database.sh');
  } catch (e) {}
  const app = await NestFactory.create(AppModule);
  const configService: ConfigService = app.get(ConfigService);
  const prismaService: PrismaService = app.get(PrismaService);
  let server_port: any = configService.get('SERVER_PORT');
  if (typeof server_port === 'string') server_port = parseInt(server_port, 10);
  if (typeof server_port !== 'number' || isNaN(server_port))
    throw new Error('Incorrect SERVER_PORT');
  app.useGlobalFilters(new HttpExceptionFilter());

  ['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach((signal) =>
    process.on(signal, async () => {
      await app.close();
      await prismaService.$disconnect();
      process.exit(0);
    }),
  );
  console.log('server_port', server_port);
  await app.listen(server_port);
}

bootstrap();
