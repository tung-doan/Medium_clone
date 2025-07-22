import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from 'src/auth/auth.module';
import { ArticlesModule } from './articles/articles.module';

@Module({
  imports: [UsersModule, DatabaseModule, AuthModule, ArticlesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
