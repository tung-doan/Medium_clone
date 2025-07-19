export interface UserResponse {
  id: number;
  username: string;
  name?: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginResponse {
  token: string;
  user: UserResponse;
}

export interface RegisterResponse {
  token: string;
}

export interface ApiResponse<T> {
  status: 'success' | 'error';
  message: string;
  result?: T;
  error?: string;
}
