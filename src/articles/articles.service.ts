import {
  Injectable,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { DatabaseService } from '../database/database.service';
import { Prisma } from '@prisma/client';
import slugify from 'slugify';
import {
  ArticleResponse,
  ArticleListResponse,
  ArticleWithRelations,
} from './entities/article.entity';

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

        if (tagList && tagList.length > 0) {
          await this.handleArticleTags(prisma, createdArticle.id, tagList);
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
      const trimmedTagName = tagName.trim();

      if (!trimmedTagName) continue;

      const tagSlug = slugify(trimmedTagName, { lower: true, strict: true });

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
    currentUserId?: number,
  ): Promise<ArticleListResponse> {
    const whereConditions: Prisma.ArticlesWhereInput = {};

    if (tag) {
      whereConditions.tagList = {
        contains: tag,
      };
    }

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
              id: true,
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
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      this.databaseService.articles.count({
        where: whereConditions,
      }),
    ]);

    const articlesWithStatus = await Promise.all(
      articles.map(async (article) => {
        const favorited = currentUserId
          ? article.favorited.some((fav) => fav.userId === currentUserId)
          : false;

        let following = false;
        if (currentUserId && currentUserId !== article.author.id) {
          const followRelation = await this.databaseService.follow.findUnique({
            where: {
              followerId_followingId: {
                followerId: currentUserId,
                followingId: article.author.id,
              },
            },
          });
          following = !!followRelation;
        }

        const mappedArticle = {
          ...article,
          author: {
            ...article.author,
            bio: article.author.bio ?? undefined,
            image: article.author.image ?? undefined,
          },
        };

        return this.transformArticleResponse(
          mappedArticle,
          favorited,
          following,
        );
      }),
    );

    return {
      articles: articlesWithStatus,
      articlesCount: totalCount,
    };
  }

  async favorite(slug: string, userId: number): Promise<ArticleResponse> {
    const article = await this.getArticleWithRelationsBySlug(slug);
    if (!article) throw new NotFoundException('Article not found');

    const alreadyFavorited = article.favorited.some(
      (fav) => fav.userId === userId,
    );
    if (!alreadyFavorited) {
      await this.databaseService.$transaction(async (prisma) => {
        await prisma.favorites.create({
          data: { userId, articleId: article.id },
        });
        await prisma.articles.update({
          where: { id: article.id },
          data: { favoritesCount: article.favoritesCount + 1 },
        });
      });
    }

    if (alreadyFavorited) {
      throw new ConflictException('You have already favorited this article');
    }

    const updated = await this.databaseService.articles.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            bio: true,
            image: true,
          },
        },
        favorited: {
          select: { userId: true },
        },
      },
    });

    if (!updated) {
      throw new NotFoundException('Article not found after favoriting');
    }

    const favorited = updated.favorited.some((fav) => fav.userId === userId);
    let following = false;
    if (userId !== updated.author.id) {
      const follow = await this.databaseService.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: userId,
            followingId: updated.author.id,
          },
        },
      });
      following = !!follow;
    }

    const mappedUpdated = {
      ...updated,
      author: {
        ...updated.author,
        bio: updated.author.bio ?? undefined,
        image: updated.author.image ?? undefined,
      },
    };

    return this.transformArticleResponse(mappedUpdated, favorited, following);
  }

  async unfavorite(slug: string, userId: number): Promise<ArticleResponse> {
    const article = await this.getArticleWithRelationsBySlug(slug);
    if (!article) throw new NotFoundException('Article not found');

    const alreadyFavorited = article.favorited.some(
      (fav) => fav.userId === userId,
    );
    if (alreadyFavorited) {
      await this.databaseService.$transaction(async (prisma) => {
        await prisma.favorites.deleteMany({
          where: { userId, articleId: article.id },
        });
        await prisma.articles.update({
          where: { id: article.id },
          data: { favoritesCount: Math.max(0, article.favoritesCount - 1) },
        });
      });
    }

    if (!alreadyFavorited) {
      throw new ConflictException('You have not favorited this article');
    }

    const updated = await this.databaseService.articles.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            bio: true,
            image: true,
          },
        },
        favorited: {
          select: { userId: true },
        },
      },
    });

    if (!updated) {
      throw new NotFoundException('Article not found after unfavoriting');
    }

    const favorited = updated.favorited.some((fav) => fav.userId === userId);
    let following = false;
    if (userId !== updated.author.id) {
      const follow = await this.databaseService.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: userId,
            followingId: updated.author.id,
          },
        },
      });
      following = !!follow;
    }

    const mappedUpdated = {
      ...updated,
      author: {
        ...updated.author,
        bio: updated.author.bio ?? undefined,
        image: updated.author.image ?? undefined,
      },
    };

    return this.transformArticleResponse(mappedUpdated, favorited, following);
  }

  private transformArticleResponse(
    article: ArticleWithRelations,
    favorited: boolean,
    following: boolean,
  ): ArticleResponse {
    const tagList = article.tagList
      ? article.tagList
          .split(',')
          .filter((tag: string) => tag.trim().length > 0)
      : [];

    return {
      id: article.id,
      title: article.title,
      description: article.description || undefined,
      body: article.body,
      slug: article.slug,
      authorId: article.authorId,
      favoritesCount: article.favoritesCount,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      author: {
        id: article.id,
        username: article.author.username,
        bio: article.author.bio || undefined,
        image: article.author.image || undefined,
        following,
      },
      favorited,
      tagList,
    };
  }

  async getFeed(
    userId: number,
    limit = 20,
    offset = 0,
  ): Promise<ArticleListResponse> {
    const [articles, totalCount] = await Promise.all([
      this.databaseService.articles.findMany({
        where: {
          author: {
            followers: {
              some: {
                followerId: userId,
              },
            },
          },
        },
        include: {
          author: {
            select: {
              id: true,
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
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      this.databaseService.articles.count({
        where: {
          author: {
            followers: {
              some: {
                followerId: userId,
              },
            },
          },
        },
      }),
    ]);

    const articlesWithStatus = articles.map((article) => {
      const favorited = article.favorited.some((fav) => fav.userId === userId);
      const mappedArticle = {
        ...article,
        author: {
          ...article.author,
          bio: article.author.bio ?? undefined,
          image: article.author.image ?? undefined,
        },
      };
      return this.transformArticleResponse(mappedArticle, favorited, true);
    });

    return {
      articles: articlesWithStatus,
      articlesCount: totalCount,
    };
  }
  async findOne(
    slug: string,
    currentUserId?: number,
  ): Promise<ArticleResponse> {
    const article = await this.getArticleWithRelationsBySlug(slug);
    if (!article) throw new NotFoundException('Article not found');
    // favorited: boolean - true nếu user hiện tại đã favorite bài viết, false nếu chưa
    const favorited = currentUserId
      ? article.favorited.some((fav) => fav.userId === currentUserId)
      : false;

    let following = false;
    if (currentUserId && currentUserId !== article.author.id) {
      const followRelation = await this.databaseService.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: article.author.id,
          },
        },
      });
      following = !!followRelation;
    }

    const mappedArticle = {
      ...article,
      author: {
        ...article.author,
        bio: article.author.bio ?? undefined,
        image: article.author.image ?? undefined,
      },
    };

    return this.transformArticleResponse(mappedArticle, favorited, following);
  }

  async update(
    slug: string,
    updateArticleDto: UpdateArticleDto,
    currentUserId: number,
  ): Promise<ArticleResponse> {
    const existingArticle = await this.getArticleWithRelationsBySlug(slug);
    if (!existingArticle) throw new NotFoundException('Article not found');

    if (existingArticle.authorId !== currentUserId) {
      throw new ForbiddenException('You can only update your own articles');
    }

    let newSlug = existingArticle.slug;
    if (
      updateArticleDto.title &&
      updateArticleDto.title !== existingArticle.title
    ) {
      newSlug = this.createSlug(updateArticleDto.title);

      const slugConflict = await this.databaseService.articles.findUnique({
        where: { slug: newSlug },
      });

      if (slugConflict && slugConflict.id !== existingArticle.id) {
        throw new ConflictException(
          'An article with this title already exists',
        );
      }
    }

    const updatedArticle = await this.databaseService.$transaction(
      async (prisma: Prisma.TransactionClient) => {
        const updateData: {
          title?: string;
          description?: string;
          body?: string;
          tagList?: string;
          slug?: string;
        } = {};

        if (updateArticleDto.title) {
          updateData.title = updateArticleDto.title;
          updateData.slug = newSlug;
        }

        if (updateArticleDto.description !== undefined) {
          updateData.description = updateArticleDto.description;
        }

        if (updateArticleDto.body) {
          updateData.body = updateArticleDto.body;
        }

        if (updateArticleDto.tagList !== undefined) {
          const tagListString =
            updateArticleDto.tagList && updateArticleDto.tagList.length > 0
              ? updateArticleDto.tagList.join(',')
              : '';
          updateData.tagList = tagListString;

          // Remove existing article-tag relationships
          await prisma.articleTags.deleteMany({
            where: { articleId: existingArticle.id },
          });

          // Create new article-tag relationships
          if (updateArticleDto.tagList && updateArticleDto.tagList.length > 0) {
            await this.handleArticleTags(
              prisma,
              existingArticle.id,
              updateArticleDto.tagList,
            );
          }
        }

        const updatedArticle = await prisma.articles.update({
          where: { id: existingArticle.id },
          data: updateData,
          include: {
            author: {
              select: {
                id: true,
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
        });

        return updatedArticle;
      },
    );

    const favorited = updatedArticle.favorited.some(
      (fav) => fav.userId === currentUserId,
    );

    const following = false;
    const mappedArticle = {
      ...updatedArticle,
      author: {
        ...updatedArticle.author,
        bio: updatedArticle.author.bio ?? undefined,
        image: updatedArticle.author.image ?? undefined,
      },
    };

    return this.transformArticleResponse(mappedArticle, favorited, following);
  }

  private createSlug(title: string): string {
    return slugify(title, { lower: true, strict: true }) + '-' + Date.now();
  }

  async remove(slug: string, currentUserId: number): Promise<void> {
    const article = await this.databaseService.articles.findUnique({
      where: { slug },
      select: {
        id: true,
        authorId: true,
        title: true,
      },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    if (article.authorId !== currentUserId) {
      throw new ForbiddenException('You can only delete your own articles');
    }

    await this.databaseService.$transaction(
      async (prisma: Prisma.TransactionClient) => {
        await Promise.all([
          prisma.articleTags.deleteMany({
            where: { articleId: article.id },
          }),
          prisma.favorites.deleteMany({
            where: { articleId: article.id },
          }),
        ]);

        await prisma.articles.delete({
          where: { id: article.id },
        });
      },
    );
  }

  async getArticleBySlugOrThrow(slug: string) {
    const article = await this.databaseService.articles.findUnique({
      where: { slug },
    });
    if (!article) throw new NotFoundException('Article not found');
    return article;
  }

  private async getArticleWithRelationsBySlug(slug: string) {
    return await this.databaseService.articles.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            bio: true,
            image: true,
          },
        },
        favorited: {
          select: { userId: true },
        },
      },
    });
  }
}
