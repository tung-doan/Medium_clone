import { Injectable, ConflictException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { DatabaseService } from '../database/database.service'; // Adjust the path as needed
import { Users } from './users.model';

@Injectable()
export class UsersService {
  constructor(private readonly databaseService: DatabaseService) {}

  async createUser(data: CreateUserDto): Promise<Users> {
    await this.checkDuplicateUser(data);
    return this.databaseService.users.create({
      data,
    });
  }

  private async checkDuplicateUser(data: CreateUserDto): Promise<void> {
    const [existingUser, existingEmail] = await Promise.all([
      this.databaseService.users.findUnique({
        where: { username: data.username },
      }),
      this.databaseService.users.findUnique({ where: { email: data.email } }),
    ]);

    if (existingUser) throw new ConflictException('Username already exists');
    if (existingEmail) throw new ConflictException('Email already exists');
  }
}
