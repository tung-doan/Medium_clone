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

  async create(articleSlug: string, userId: number, createCommentDto: CreateCommentDto) {
    const article = await this.databaseService.articles.findUnique({
      where: { slug: articleSlug },
    });
    if (!article) throw new NotFoundException('Article not found');

    const comment = await this.databaseService.comments.create({
      data: {
        body: createCommentDto.body,
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

    const authorIds = comments.map((c) => c.author.id);

    let followingMap: Record<number, boolean> = {};
    if (currentUserId) {
      const follows = await this.databaseService.follow.findMany({
        where: {
          followerId: currentUserId,
          followingId: { in: authorIds.filter((id) => id !== currentUserId) },
        },
        select: { followingId: true },
      });
      followingMap = follows.reduce(
        (acc, follow) => {
          acc[follow.followingId] = true;
          return acc;
        },
        {} as Record<number, boolean>,
      );
    }

    const mappedComments = comments.map((comment) => {
      const following =
        currentUserId && currentUserId !== comment.author.id
          ? !!followingMap[comment.author.id]
          : false;
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
    });

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
