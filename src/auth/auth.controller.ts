import { AuthService } from 'src/auth/auth.service';
import { Controller, Post, Body, Res, Req } from '@nestjs/common';
import { LoginDto } from 'src/auth/dto/login-user.dto';
import { Request, Response } from 'express';
import { RegisterDto } from 'src/auth/dto/register-user.dto';
import { HttpStatus } from '@nestjs/common';

@Controller('/api')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/login')
  async login(
    @Req() request: Request,
    @Res() response: Response,
    @Body() loginDto: LoginDto,
  ) {
    try {
      const result = await this.authService.login(loginDto);
      return response.status(HttpStatus.OK).json({
        status: 'success',
        message: 'Login successful',
        result: result,
      });
    } catch (error: unknown) {
      let errorMessage = 'An unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      return response.status(HttpStatus.UNAUTHORIZED).json({
        status: 'error',
        message: 'Login failed',
        error: errorMessage,
      });
    }
  }

  @Post('/users')
  async register(
    @Req() request: Request,
    @Res() response: Response,
    @Body() registerDto: RegisterDto,
  ) {
    try {
      const result = await this.authService.register(registerDto);
      return response.status(HttpStatus.CREATED).json({
        status: 'success',
        message: 'register successful',
        result: result,
      });
    } catch (error) {
      let errorMessage = 'An unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'register failed',
        error: errorMessage,
      });
    }
  }
}
