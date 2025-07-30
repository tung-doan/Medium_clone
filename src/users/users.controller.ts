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
import { I18nService } from 'nestjs-i18n';

@Controller('api')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly i18n: I18nService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('/user')
  getCurrentUser(@Req() request: AuthenticatedRequest) {
    const user = request.user;
    return {
      status: 'success',
      message: this.i18n.translate('users.success.get_user_success'),
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
      message: this.i18n.translate('users.success.update_success'),
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
    const result = await this.usersService.followUser(request.user.id, username);
    return {
      status: 'success',
      message: this.i18n.translate('users.success.follow_success'),
      result,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/profiles/:username/follow')
  async unfollowUser(
    @Param('username') username: string,
    @Req() request: AuthenticatedRequest,
  ) {
    const result = await this.usersService.unfollowUser(request.user.id, username);
    return {
      status: 'success',
      message: this.i18n.translate('users.success.unfollow_success'),
      result,
    };
  }
}