import { AuthService } from 'src/auth/auth.service';
import { Controller, Post, Body } from '@nestjs/common';
import { LoginDto } from 'src/auth/dto/login-user.dto';
import { RegisterDto } from 'src/auth/dto/register-user.dto';
import { I18nService } from 'nestjs-i18n';

@Controller('/api')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly i18n: I18nService,
  ) {}

  @Post('/login')
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);
    return {
      status: 'success',
      message:  this.i18n.translate('auth.success.login_success'),
      result,
    };
  }

  @Post('/users')
  async register(@Body() registerDto: RegisterDto) {
    const result = await this.authService.register(registerDto);
    return {
      status: 'success',
      message:  this.i18n.translate('auth.success.register_success'),
      result,
    };
  }
}