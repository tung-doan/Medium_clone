import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentsService {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(articleSlug: string, userId: number, dto: CreateCommentDto) {
    const article = await this.databaseService.articles.findUnique({
      where: { slug: articleSlug },
    });
    if (!article) throw new NotFoundException('Article not found');

    const comment = await this.databaseService.comments.create({
      data: {
        body: dto.body,
        articleId: article.id,
        authorId: userId,
      },
      include: {
        author: {
          select: { id: true, username: true, bio: true, image: true },
        },
      },
    });

    // Check following status
    let following = false;
    if (userId !== comment.author.id) {
      const follow = await this.databaseService.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: userId,
            followingId: comment.author.id,
          },
        },
      });
      following = !!follow;
    }

    return {
      comment: {
        id: comment.id,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        body: comment.body,
        author: {
          username: comment.author.username,
          bio: comment.author.bio ?? undefined,
          image: comment.author.image ?? undefined,
          following,
        },
      },
    };
  }

  async findAll(articleSlug: string, currentUserId?: number) {
    const article = await this.databaseService.articles.findUnique({
      where: { slug: articleSlug },
    });
    if (!article) throw new NotFoundException('Article not found');

    const comments = await this.databaseService.comments.findMany({
      where: { articleId: article.id },
      include: {
        author: {
          select: { id: true, username: true, bio: true, image: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Map each comment to include following
    const mappedComments = await Promise.all(
      comments.map(async (comment) => {
        let following = false;
        if (currentUserId && currentUserId !== comment.author.id) {
          const follow = await this.databaseService.follow.findUnique({
            where: {
              followerId_followingId: {
                followerId: currentUserId,
                followingId: comment.author.id,
              },
            },
          });
          following = !!follow;
        }
        return {
          id: comment.id,
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt,
          body: comment.body,
          author: {
            username: comment.author.username,
            bio: comment.author.bio ?? undefined,
            image: comment.author.image ?? undefined,
            following,
          },
        };
      }),
    );

    return { comments: mappedComments };
  }

  async remove(commentId: number, userId: number) {
    const comment = await this.databaseService.comments.findUnique({
      where: { id: commentId },
    });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.authorId !== userId)
      throw new ForbiddenException('Not allowed');

    await this.databaseService.comments.delete({ where: { id: commentId } });
    return { message: 'Comment deleted successfully' };
  }
}