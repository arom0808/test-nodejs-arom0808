import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { CountriesModule } from './countries/countries.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    CountriesModule,
    AuthModule,
    PrismaModule,
    UsersModule,
    ConfigModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
