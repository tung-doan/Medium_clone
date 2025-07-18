import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthController } from "src/auth/auth.controller";
import { AuthService } from "src/auth/auth.service";
import { JwtStrategy } from "src/auth/jwt.strategy";
import { DatabaseService } from "src/database/database.service";
import { UsersModule } from "src/users/users.module";
import { UsersService } from "src/users/users.service";



@Module({
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy, UsersService, DatabaseService],
    imports: [
        UsersModule, 
        PassportModule,
        JwtModule.register({
            secret: process.env.JWT_SECRET,
            signOptions: {
                expiresIn: process.env.EXPIRES_IN || '1h'
            }
        })
    ]
})
export class AuthModule {}