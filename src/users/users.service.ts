import { Injectable, ConflictException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { DatabaseService } from '../database/database.service'; // Adjust the path as needed
import { Users } from './users.model';

@Injectable()
export class UsersService {
  constructor(private readonly databaseService: DatabaseService) {}

  async createUser(data: CreateUserDto): Promise<Users> {
    const existingUser = await this.databaseService.users.findUnique({
      where: {
        username: data.username,
      },
    });
    if (existingUser) {
      throw new ConflictException('username already exists');
    }

    return this.databaseService.users.create({
      data,
    });
  }
}
