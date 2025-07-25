import { Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from 'src/database/database.service';
import { UsersService } from 'src/users/users.service';
import { LoginDto } from 'src/auth/dto/login-user.dto';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from 'src/auth/dto/register-user.dto';
import { I18nService } from 'nestjs-i18n'; // Thêm dòng này

import {
  LoginResponse,
  RegisterResponse,
} from 'src/auth/interfaces/auth.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly databaseService: DatabaseService,
    private jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly i18n: I18nService, // Thêm dòng này
  ) {}

  async login(loginDto: LoginDto): Promise<LoginResponse> {
    const { email, password } = loginDto;
    const user = await this.databaseService.users.findUnique({
      where: { email },
    });
    if (!user) {
      throw new NotFoundException(
         this.i18n.translate('auth.errors.user_not_found'),
      );
    }
    const validatepassword = await bcrypt.compare(password, user.password);
    if (!validatepassword) {
      throw new NotFoundException(
         this.i18n.translate('auth.errors.invalid_credentials'),
      );
    }
    return {
      token: this.jwtService.sign({ id: user.id, username: user.username }),
      user: {
        id: user.id,
        username: user.username,
        name: user.name ?? undefined,
        email: user.email,
        bio: user.bio ?? undefined,
        image: user.image ?? undefined,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }

  async register(registerDto: RegisterDto): Promise<RegisterResponse> {
    const createUserDto = {
      username: registerDto.username,
      name: registerDto.name ? registerDto.name : undefined,
      email: registerDto.email,
      password: await bcrypt.hash(registerDto.password, 10),
    };

    const user = await this.usersService.createUser(createUserDto);

    return {
      token: this.jwtService.sign({ id: user.id, username: user.username }),
    };
  }
}