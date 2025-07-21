import { Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from 'src/database/database.service';
import { UsersService } from 'src/users/users.service';
import { LoginDto } from 'src/auth/dto/login-user.dto';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from 'src/auth/dto/register-user.dto';

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
  ) {}

  async login(loginDto: LoginDto): Promise<LoginResponse> {
    const { email, password } = loginDto;
    const user = await this.databaseService.users.findUnique({
      where: { email },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const validatepassword = await bcrypt.compare(password, user.password);
    if (!validatepassword) {
      throw new NotFoundException('Invalid credentials');
    }
    return {
      token: this.jwtService.sign({ id: user.id, username: user.username }),
      user: {
        id: user.id,
        username: user.username,
        name: user.name ?? undefined,
        email: user.email,
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
      token: this.jwtService.sign({ username: user.username }),
    };
  }
}
