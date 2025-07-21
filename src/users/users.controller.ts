import { Controller,Body, Res, Req, Get, UseGuards, Put, HttpException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { UpdateUserDto } from './dto/update-user.dto'

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
}
