export interface CommentResponse {
  id: number;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: number;
    username: string;
    bio?: string;
    image?: string;
  };
}