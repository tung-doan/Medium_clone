import { Prisma } from '@prisma/client';

export class Users implements Prisma.UsersCreateInput {
  id: number;
  name: string | null;
  password: string;
  username: string;
  email: string;
}
