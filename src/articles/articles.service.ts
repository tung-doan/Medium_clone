import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { DatabaseService } from '../database/database.service';
import { Prisma } from '@prisma/client';
import slugify from 'slugify';

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
  findAll() {
    return `This action returns all articles`;
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

