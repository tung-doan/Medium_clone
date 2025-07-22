import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { DatabaseService } from '../database/database.service';
import { Prisma } from '@prisma/client';
import slugify from 'slugify';
import {ArticleResponse, ArticleListResponse} from './entities/article.entity'

@Injectable()
export class ArticlesService {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(createArticleDto: CreateArticleDto, authorId: number) {
    const { title, tagList } = createArticleDto;
    const slug = slugify(title, { lower: true, strict: true });
    const existingArticle = await this.databaseService.articles.findUnique({
      where: { slug },
    });
    if (existingArticle) {
      throw new ForbiddenException('Article with this title already exists');
    }
    const article = await this.databaseService.$transaction(
      async (prisma: Prisma.TransactionClient) => {
        // 1. Create article với tagList array
        const createdArticle = await prisma.articles.create({
          data: {
            title: createArticleDto.title,
            description: createArticleDto.description,
            body: createArticleDto.body,
            tagList: JSON.stringify(tagList || []),
            slug,
            authorId,
          },
          include: {
            author: {
              select: {
                username: true,
                bio: true,
                image: true,
              },
            },
            articleTags: {
              include: {
                tag: true,
              },
            },
          },
        });

        if (tagList && tagList.length > 0) { // Fix: check tagList directly
          await this.handleArticleTags(
            prisma,
            createdArticle.id,
            tagList, // Fix: pass tagList directly (not undefined)
          );
        }

        return createdArticle;
      },
    );
    return {
      ...article,
      tagList: tagList || [],
      author: {
        ...article.author,
      },
    };
  }

  private async handleArticleTags(
    prisma: Prisma.TransactionClient,
    articleId: number,
    tagNames: string[],
  ): Promise<void> {
    for (const tagName of tagNames) {
      const trimmedTagName = tagName.trim(); // Remove any whitespace
      
      if (!trimmedTagName) continue; // Skip empty tags
      
      const tagSlug = slugify(trimmedTagName, { lower: true, strict: true });

      // Find or create tag
      let tag = await prisma.tags.findUnique({
        where: { name: trimmedTagName },
      });

      if (!tag) {
        tag = await prisma.tags.create({
          data: {
            name: trimmedTagName,
            slug: tagSlug,
          },
        });
      }

      // Create article-tag relationship (nếu chưa tồn tại)
      try {
        await prisma.articleTags.create({
          data: {
            articleId,
            tagId: tag.id,
          },
        });
      } catch (error) {
        const errorMessage =
          error && typeof error === 'object' && 'message' in error
            ? (error as { message?: string }).message
            : String(error);
        throw new BadRequestException(`Tag relation error: ${errorMessage}`);
      }
      }
    }
  async findAll(
    limit = 20,
    offset = 0,
    tag?: string,
    author?: string,
    favorited?: string,
    currentUserId?: number
  ): Promise<ArticleListResponse> {
    const whereConditions: any = {};

    // Filter by tag using string contains (fast query)
    if (tag) {
      whereConditions.tagList = {
        contains: tag, // Fast string search: WHERE tagList LIKE '%tag%'
      };
    }

    // Filter by author username
    if (author) {
      whereConditions.author = {
        username: author,
      };
    }

    if (favorited) {
      whereConditions.favorited = {
        some: {
          user: {
            username: favorited,
          },
        },
      };
    }

    const [articles, totalCount] = await Promise.all([
      this.databaseService.articles.findMany({
        where: whereConditions,
        include: {
          author: {
            select: {
              username: true,
              bio: true,
              image: true,
            },
          },
          favorited: {
            select: {
              userId: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc', // Most recent first
        },
        take: limit,
        skip: offset,
      }),
      this.databaseService.articles.count({
        where: whereConditions,
      }),
    ]);

    const articlesWithStatus = articles.map(article => 
      this.transformArticleResponse(
        article, 
        currentUserId ? article.favorited.some(fav => fav.userId === currentUserId) : false
      )
    );

    return {
      articles: articlesWithStatus,
      articlesCount: totalCount,
    };
  }

  private transformArticleResponse(article: any, favorited: boolean): ArticleResponse {
    // Convert tagList string back to array for API response
    const tagList = article.tagList 
      ? article.tagList.split(',').filter((tag: string) => tag.trim().length > 0)
      : [];

    return {
      id: article.id,
      title: article.title,
      description: article.description,
      body: article.body,
      slug: article.slug,
      authorId: article.authorId,
      favoritesCount: article.favoritesCount,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      author: {
        username: article.author.username,
        bio: article.author.bio,
        image: article.author.image,
        following: false, // For now, always false (TODO: implement following)
      },
      favorited,
      tagList, // Return as array for API compatibility
    };
  }

  findOne(id: number) {
    return `This action returns a #${id} article`;
  }

  update(id: number, updateArticleDto: UpdateArticleDto) {
    return `This action updates a #${id} article`;
  }

  remove(id: number) {
    return `This action removes a #${id} article`;
  }
}

