import { Injectable, NotFoundException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { DatabaseService } from "src/database/database.service";
import { UsersService } from "src/users/users.service";
import { LoginDto } from "src/auth/dto/login-user.dto";
import * as bcrypt from 'bcrypt';
import { RegisterDto } from "src/auth/dto/register-user.dto";
import {Users} from "src/users/users.model"

@Injectable()
export class AuthService {
  constructor(private readonly databaseService: DatabaseService,
    private jwtService: JwtService,
    private readonly usersService: UsersService) {}


    async login(loginDto: LoginDto): Promise<any>{
        const {username, password}  = loginDto;
        const user = await this.databaseService.users.findUnique({
            where: { username }
        });
        if (!user){
            throw new NotFoundException('User not found');
        }
        const validatepassword = await  bcrypt.compare(password, user.password);
        if(!validatepassword){
            throw new NotFoundException('Invalid credentials');
        }
        return {
            token: this.jwtService.sign({ id: user.id, username: user.username }),
            user: {
                id: user.id,
                username: user.username,
                name: user.name,
                email: user.email,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }
        }
    }

    async register(registerDto: RegisterDto): Promise<any> {
        const createUsers = new Users()
        createUsers.username = registerDto.username;
        createUsers.name = registerDto.name;
        createUsers.email = registerDto.email;
        createUsers.password = await bcrypt.hash(registerDto.password, 10);

        const user = await this.usersService.createUser(createUsers) as Users

        return {
            token: this.jwtService.sign({ username: user.username })
        }
    }
}