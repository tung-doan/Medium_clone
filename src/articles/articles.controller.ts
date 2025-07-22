import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Res,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { Users } from '@prisma/client';
import { Request, Response } from 'express';

interface AuthenticatedRequest {
  user: Users;
}

@Controller('/api/articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Body() createArticleDto: CreateArticleDto,
    @Req() request: AuthenticatedRequest,
    @Res() response: Response,
  ) {
    try {
      const article = await this.articlesService.create(
        createArticleDto,
        request.user.id,
      );
      return response.status(HttpStatus.CREATED).json({
        article,
      });
    } catch (error) {
      let errorMessage = 'An unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      return response.status(HttpStatus.BAD_REQUEST).json({
        errors: {
          body: [errorMessage],
        },
      });
    }
  }

  @Get()
  async findAll(
    @Req() request: AuthenticatedRequest, // Optional auth
    @Res() response: Response,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('tag') tag?: string,
    @Query('author') author?: string,
    @Query('favorited') favorited?: string,
  ) {
    try {
      const currentUserId = request.user?.id;
      const result = await this.articlesService.findAll(
        limit ? parseInt(limit) : 20,
        offset ? parseInt(offset) : 0,
        tag,
        author,
        favorited,
        currentUserId,
      );
      
      return response.status(HttpStatus.OK).json(result);
    } catch (error) {
      let errorMessage = 'An unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        errors: {
          body: [errorMessage],
        },
      });
    }
  }

  @Get('feed')
  @UseGuards(JwtAuthGuard)
  async getFeed(
    @Req() request: AuthenticatedRequest,
    @Res() response: Response,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    try {
      const result = await this.articlesService.getFeed(
        request.user.id,
        limit ? parseInt(limit) : 20,
        offset ? parseInt(offset) : 0,
      );
      
      return response.status(HttpStatus.OK).json(result);
    } catch (error) {
      let errorMessage = 'An unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        errors: {
          body: [errorMessage],
        },
      });
    }
  }

  @Get(':slug')
  async findOne(
    @Param('slug') slug: string,
    @Req() request: AuthenticatedRequest, // Optional auth
    @Res() response: Response,
  ) {
    try {
      const currentUserId = request.user?.id;
      const article = await this.articlesService.findOne(slug, currentUserId);
      return response.status(HttpStatus.OK).json({
        article,
      });
    } catch (error) {
      let errorMessage = 'An unknown error occurred';
      let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      
      if (error instanceof Error) {
        errorMessage = error.message;
        if (error.message === 'Article not found') {
          statusCode = HttpStatus.NOT_FOUND;
        }
      }
      
      return response.status(statusCode).json({
        errors: {
          body: [errorMessage],
        },
      });
    }
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateArticleDto: UpdateArticleDto) {
    return this.articlesService.update(+id, updateArticleDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.articlesService.remove(+id);
  }
}
