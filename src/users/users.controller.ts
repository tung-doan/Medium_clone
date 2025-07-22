import { Controller,Body, Res, Req, Get, UseGuards, Put, HttpException, Param, Post, Delete } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { UpdateUserDto } from './dto/update-user.dto'
import { Users } from '@prisma/client';
@Controller('api')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('/user')
  getCurrentUser(
    @Req() request: { user: { id: string; username: string; email: string; name: string } },
    @Res() response: Response,
  ) {
    try {
      // request.user sẽ chứa thông tin user từ JWT token
      const user = request.user;

      return response.status(HttpStatus.OK).json({
        status: 'success',
        message: 'User retrieved successfully',
        result: user,
      });
    } catch (error) {
      let errorMessage = 'An unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to get user',
        error: errorMessage,
      });
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put('/user')
  async update(
    @Body() updateUserDto: UpdateUserDto,
    @Res() response: Response,
  ): Promise<Response>{
    try{
      const updatedUser = await this.usersService.updateUser(updateUserDto.id, updateUserDto)
      return response.status(HttpStatus.OK).json({
        status: 'success',
        message: "User updated successfully",
        result: updatedUser
      })
    } catch(error){
      if(error instanceof HttpException){
        return response.status(error.getStatus()).json({
          status: 'error',
          message: 'User update failed',
          error: error.message
        })
      }
    }

    return response.status(HttpStatus.BAD_REQUEST).json({
      status: 'error',
      message: 'User update failed',
      error: 'An unknown error occurred'
    })
  }

  @Get('/profiles/:username')
  async getUserProfile(
    @Param('username') username: string,
    @Req() request: Users, // Optional auth
    @Res() response: Response,
  ) {
    try {
      const currentUserId = request.id; // Optional user ID from JWT
      const profile = await this.usersService.getUserProfile(username, currentUserId);
      
      return response.status(HttpStatus.OK).json({
        profile,
      });
    } catch (error) {
      let errorMessage = 'An unknown error occurred';
      let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      
      if (error instanceof Error) {
        errorMessage = error.message;
        if (error.message === 'User not found') {
          statusCode = HttpStatus.NOT_FOUND;
        }
      }
      
      return response.status(statusCode).json({
        errors: {
          body: [errorMessage],
        },
      });
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('/profiles/:username/follow')
  async followUser(
    @Param('username') username: string,
    @Req() request: { user: { id: number } },
    @Res() response: Response,
  ) {
    try {
      const result = await this.usersService.followUser(request.user.id, username);
      
      return response.status(HttpStatus.OK).json(result);
    } catch (error) {
      let errorMessage = 'An unknown error occurred';
      let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      
      if (error instanceof Error) {
        errorMessage = error.message;
        if (error.message === 'User not found') {
          statusCode = HttpStatus.NOT_FOUND;
        } else if (error.message.includes('already following') || error.message.includes('cannot follow')) {
          statusCode = HttpStatus.CONFLICT;
        }
      }
      
      return response.status(statusCode).json({
        errors: {
          body: [errorMessage],
        },
      });
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/profiles/:username/follow')
  async unfollowUser(
    @Param('username') username: string,
    @Req() request: { user: { id: number } },
    @Res() response: Response,
  ) {
    try {
      const result = await this.usersService.unfollowUser(request.user.id, username);

      return response.status(HttpStatus.OK).json(result);
    } catch (error) {
      let errorMessage = 'An unknown error occurred';
      let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      
      if (error instanceof Error) {
        errorMessage = error.message;
        if (error.message === 'User not found') {
          statusCode = HttpStatus.NOT_FOUND;
        } else if (error.message.includes('not following')) {
          statusCode = HttpStatus.CONFLICT;
        }
      }
      
      return response.status(statusCode).json({
        errors: {
          body: [errorMessage],
        },
      });
    }
  }
}
