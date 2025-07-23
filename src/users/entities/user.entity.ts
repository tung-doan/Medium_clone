import { Users } from '@prisma/client';

export interface UserProfile {
  username: string;
  email?: string;
  bio?: string;
  image?: string;
  following: boolean;
}

export interface FollowResponse {
  profile: UserProfile;
}

export interface AuthenticatedRequest {
  user: Users;
}
