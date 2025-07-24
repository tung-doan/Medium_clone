import { Module } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { DatabaseModule } from '../database/database.module';
import { ArticlesModule } from '../articles/articles.module';
@Module({
  imports: [DatabaseModule, ArticlesModule],
  controllers: [CommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}
