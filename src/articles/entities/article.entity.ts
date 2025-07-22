export type ArticleResponse = {
  id: number;
  title: string;
  description?: string;
  body: string;
  slug: string;
  authorId: number;
  favoritesCount: number;
  createdAt: Date;
  updatedAt: Date;
  author: {
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
