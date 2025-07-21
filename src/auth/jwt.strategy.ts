import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { DatabaseService } from '../database/database.service';
import { Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly databaseService: DatabaseService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'SecretKey',
    });
  }

  async validate(payload: { username: string }) {
    const user = await this.databaseService.users.findUnique({
      where: {
        username: payload.username,
      },
    });
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
