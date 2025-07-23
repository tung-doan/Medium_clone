import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { RegisterDto } from 'src/auth/dto/register-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { DatabaseService } from '../database/database.service'; // Adjust the path as needed
import * as bcrypt from 'bcrypt';
import { Users } from './users.model';
import { UserProfile, FollowResponse } from './entities/user.entity';

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

    if (data.password) {
      if (!data.confirmPassword) {
        throw new BadRequestException(
          'Password confirmation is required when updating password',
        );
      }

      if (data.password !== data.confirmPassword) {
        throw new BadRequestException(
          'Password and confirmation password do not match',
        );
      }

      const isSamePassword = await bcrypt.compare(data.password, user.password);
      if (isSamePassword) {
        throw new BadRequestException(
          'New password must be different from current password',
        );
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

  async getUserProfile(
    username: string,
    currentUserId?: number,
  ): Promise<UserProfile> {
    const user = await this.databaseService.users.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        email: true,
        bio: true,
        image: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    let isFollowing = false;
    if (currentUserId && currentUserId !== user.id) {
      const follow = await this.databaseService.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: user.id,
          },
        },
      });
      isFollowing = !!follow;
    }

    return {
      username: user.username,
      email: user.email,
      bio: user.bio || undefined,
      image: user.image || undefined,
      following: isFollowing,
    };
  }

  async followUser(
    currentUserId: number,
    targetUsername: string,
  ): Promise<FollowResponse> {
    // Find target user
    const targetUser = await this.databaseService.users.findUnique({
      where: { username: targetUsername },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    if (currentUserId === targetUser.id) {
      throw new ForbiddenException('You cannot follow yourself');
    }

    const existingFollow = await this.databaseService.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: targetUser.id,
        },
      },
    });

    if (existingFollow) {
      throw new ConflictException('You are already following this user');
    }
    await this.databaseService.follow.create({
      data: {
        followerId: currentUserId,
        followingId: targetUser.id,
      },
    });

    return {
      profile: {
        username: targetUser.username,
        bio: targetUser.bio || undefined,
        image: targetUser.image || undefined,
        following: true,
      },
    };
  }

  async unfollowUser(
    currentUserId: number,
    targetUsername: string,
  ): Promise<FollowResponse> {
    const targetUser = await this.databaseService.users.findUnique({
      where: { username: targetUsername },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    const existingFollow = await this.databaseService.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: targetUser.id,
        },
      },
    });

    if (!existingFollow) {
      throw new ConflictException('You are not following this user');
    }
    await this.databaseService.follow.delete({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: targetUser.id,
        },
      },
    });

    return {
      profile: {
        username: targetUser.username,
        bio: targetUser.bio || undefined,
        image: targetUser.image || undefined,
        following: false,
      },
    };
  }
}
