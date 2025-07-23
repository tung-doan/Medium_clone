import {
  Controller,
  Body,
  Get,
  UseGuards,
  Put,
  Param,
  Post,
  Delete,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { Users } from '@prisma/client';
import { AuthenticatedRequest } from 'src/users/entities/user.entity';

@Controller('api')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('/user')
  getCurrentUser(@Req() request: AuthenticatedRequest) {
    const user = request.user;
    return {
      status: 'success',
      message: 'User retrieved successfully',
      result: user,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Put('/user')
  async update(@Body() updateUserDto: UpdateUserDto) {
    const updatedUser = await this.usersService.updateUser(
      updateUserDto.id,
      updateUserDto,
    );
    return {
      status: 'success',
      message: 'User updated successfully',
      result: updatedUser,
    };
  }

  @Get('/profiles/:username')
  async getUserProfile(
    @Param('username') username: string,
    @Req() request: { user?: Users },
  ) {
    const currentUserId = request.user?.id;
    const profile = await this.usersService.getUserProfile(
      username,
      currentUserId,
    );
    return { profile };
  }

  @UseGuards(JwtAuthGuard)
  @Post('/profiles/:username/follow')
  async followUser(
    @Param('username') username: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return await this.usersService.followUser(request.user.id, username);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/profiles/:username/follow')
  async unfollowUser(
    @Param('username') username: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return await this.usersService.unfollowUser(request.user.id, username);
  }
}