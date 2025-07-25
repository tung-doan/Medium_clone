import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
  Put,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { AuthenticatedRequest } from './entities/article.entity';
import { I18nService } from 'nestjs-i18n';

@Controller('/api/articles')
export class ArticlesController {
  constructor(
    private readonly articlesService: ArticlesService,
    private readonly i18n: I18nService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Body() createArticleDto: CreateArticleDto,
    @Req() request: AuthenticatedRequest,
  ) {
    const article = await this.articlesService.create(
      createArticleDto,
      request.user.id,
    );
    return { article };
  }

  @Get()
  async findAll(
    @Req() request: AuthenticatedRequest,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
    @Query('tag') tag?: string,
    @Query('author') author?: string,
    @Query('favorited') favorited?: string,
  ) {
    const currentUserId = request.user?.id;
    return await this.articlesService.findAll(
      limit,
      offset,
      tag,
      author,
      favorited,
      currentUserId,
    );
  }

  @Get('feed')
  @UseGuards(JwtAuthGuard)
  async getFeed(
    @Req() request: AuthenticatedRequest,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ) {
    return await this.articlesService.getFeed(request.user.id, limit, offset);
  }

  @Get(':slug')
  async findOne(
    @Param('slug') slug: string,
    @Req() request: AuthenticatedRequest,
  ) {
    const currentUserId = request.user?.id;
    const article = await this.articlesService.findOne(slug, currentUserId);
    return { article };
  }

  @UseGuards(JwtAuthGuard)
  @Put(':slug')
  async update(
    @Param('slug') slug: string,
    @Body() updateArticleDto: UpdateArticleDto,
    @Req() request: AuthenticatedRequest,
  ) {
    const article = await this.articlesService.update(
      slug,
      updateArticleDto,
      request.user.id,
    );
    return { article };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':slug')
  async remove(
    @Param('slug') slug: string,
    @Req() request: AuthenticatedRequest,
  ) {
    await this.articlesService.remove(slug, request.user.id);
    return { message: this.i18n.translate('Article deleted successfully') };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':slug/favorite')
  async favorite(
    @Param('slug') slug: string,
    @Req() request: AuthenticatedRequest,
  ) {
    const article = await this.articlesService.favorite(slug, request.user.id);
    return { article };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':slug/favorite')
  async unfavorite(
    @Param('slug') slug: string,
    @Req() request: AuthenticatedRequest,
  ) {
    const article = await this.articlesService.unfavorite(
      slug,
      request.user.id,
    );
    return { article };
  }
}
