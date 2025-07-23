import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { CreateCommentDto } from './dto/create-comment.dto';
import { AuthenticatedRequest } from 'src/articles/entities/article.entity';

@Controller('/api/articles/:slug/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Param('slug') slug: string,
    @Body() dto: CreateCommentDto,
    @Req() request: AuthenticatedRequest,
  ) {
    const comment = await this.commentsService.create(slug, request.user.id, dto);
    return { comment };
  }

  @Get()
  async findAll(@Param('slug') slug: string) {
    const comments = await this.commentsService.findAll(slug);
    return { comments };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':commentId')
  async remove(
    @Param('slug') slug: string,
    @Param('commentId') commentId: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return await this.commentsService.remove(Number(commentId), request.user.id);
  }
}