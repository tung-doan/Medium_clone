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
  findAll() {
    return this.articlesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.articlesService.findOne(+id);
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
