import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException
} from '@nestjs/common';
import { RegisterDto } from 'src/auth/dto/register-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { DatabaseService } from '../database/database.service'; // Adjust the path as needed
import * as bcrypt from 'bcrypt';
import { Users } from './users.model';

@Injectable()
export class UsersService {
  constructor(private readonly databaseService: DatabaseService) {}

  async createUser(data: RegisterDto): Promise<Users> {
    await this.checkDuplicateUserOnCreate(data);
    return this.databaseService.users.create({
      data,
    });
  }

  async updateUser(id: number, data: UpdateUserDto) {
    const user = await this.databaseService.users.findUnique({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    // Kiểm tra confirmpassword nếu password có đổi
    if (data.password) {
      if (!data.confirmPassword) {
        throw new BadRequestException('Password confirmation is required when updating password');
      }

      if (data.password !== data.confirmPassword) {
        throw new BadRequestException('Password and confirmation password do not match');
      }

      const isSamePassword = await bcrypt.compare(data.password, user.password);
      if (isSamePassword) {
        throw new BadRequestException('New password must be different from current password');
      }
    }

    await this.checkDuplicateUserOnUpdate(data, id);
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    const updatedUser = await this.databaseService.users.update({
      where: { id },
      data,
    });

    return this.userUpdateResponse(updatedUser);
  }

  private userUpdateResponse(user: Users) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...rest } = user;
    return rest;
  }

  private async checkDuplicateUserOnCreate(data: RegisterDto): Promise<void> {
    const [existingUser, existingEmail] = await Promise.all([
      this.databaseService.users.findUnique({
        where: { username: data.username },
      }),
      this.databaseService.users.findUnique({ where: { email: data.email } }),
    ]);

    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    if (existingEmail) {
      throw new ConflictException('Email already exists');
    }
  }

  private async checkDuplicateUserOnUpdate(
    data: UpdateUserDto,
    userIdToExclude: number,
  ): Promise<void> {
    const checks: Promise<Users | null>[] = [];

    if (data.username !== undefined) {
      checks.push(
        this.databaseService.users.findUnique({
          where: { username: data.username },
        }),
      );
    } else {
      checks.push(Promise.resolve(null));
    }

    if (data.email !== undefined) {
      checks.push(
        this.databaseService.users.findUnique({ where: { email: data.email } }),
      );
    } else {
      checks.push(Promise.resolve(null));
    }

    const [existingUser, existingEmail] = await Promise.all(checks);

    if (existingUser && existingUser.id !== userIdToExclude) {
      throw new ConflictException('Username already exists');
    }

    if (existingEmail && existingEmail.id !== userIdToExclude) {
      throw new ConflictException('Email already exists');
    }
  }
}
