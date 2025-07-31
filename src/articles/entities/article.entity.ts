import { Users } from '@prisma/client';

export type ArticleResponse = {
  id: number;
  title: string;
  description?: string;
  body: string;
  slug: string;
  authorId: number;
  favoritesCount: number;
  commentsCount: number;
  createdAt: Date;
  updatedAt: Date;
  isDraft: boolean;
  author: {
    id: number;
    username: string;
    bio?: string;
    image?: string;
    following: boolean;
  };
  favorited: boolean;
  tagList: string[];
};

export interface ArticleListResponse {
  articles: ArticleResponse[];
  articlesCount: number;
}

export interface ArticleAuthor {
  id: number;
  username: string;
  bio?: string;
  image?: string;
  following?: boolean;
}

export interface ArticleCreateData {
  title: string;
  description?: string;
  body: string;
  tagList: string;
  slug: string;
  authorId: number;
}

// Type for Prisma query result
export interface ArticleWithRelations {
  id: number;
  title: string;
  description: string | null;
  body: string;
  slug: string;
  authorId: number;
  favoritesCount: number;
  createdAt: Date;
  updatedAt: Date;
  tagList: string;
  author: ArticleAuthor;
  isDraft: boolean;
  favorited: Array<{
    // Kiểm tra xem userid hiện tại có trong mảng favorited hay không từ đấy xác định được favourite trong ArticleResponse
    userId: number;
  }>;
  comments: Array<{
    id: number;
  }>;
}

export interface AuthenticatedRequest {
  user: Users;
}
