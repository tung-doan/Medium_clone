import { ExecutionContext, UnauthorizedException, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Users } from 'src/users/users.model';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest<TUser = Users>(err: Error | null, user: TUser | false): TUser {
    if (err || !user) {
      throw err || new UnauthorizedException('Unauthorized');
    }
    return user;
  }
}
