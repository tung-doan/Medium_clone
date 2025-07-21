import { Controller, Res, Req, Get, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { HttpStatus } from '@nestjs/common';
import { Response } from 'express';

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
}
