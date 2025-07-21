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

  async validate(payload: { id: number }) {
    const user = await this.databaseService.users.findUnique({
      where: {
        id: payload.id,
      },
    });
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
