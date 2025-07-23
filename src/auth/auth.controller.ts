import { AuthService } from 'src/auth/auth.service';
import { Controller, Post, Body } from '@nestjs/common';
import { LoginDto } from 'src/auth/dto/login-user.dto';
import { RegisterDto } from 'src/auth/dto/register-user.dto';

@Controller('/api')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/login')
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);
    return {
      status: 'success',
      message: 'Login successful',
      result,
    };
  }

  @Post('/users')
  async register(@Body() registerDto: RegisterDto) {
    const result = await this.authService.register(registerDto);
    return {
      status: 'success',
      message: 'register successful',
      result,
    };
  }
}
