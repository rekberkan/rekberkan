import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '@core/user/user.service';
import { IAuthUser } from '@common/interfaces/user.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret'),
    });
  }

  async validate(payload: any): Promise<IAuthUser> {
    const user = await this.userService.findById(payload.sub) as any;
    
    if (!user) {
      throw new UnauthorizedException('User found in token no longer exists');
    }

    if (user.status && user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User account is currently restricted');
    }

    // SECURITY: Return sanitized identity
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      isAdmin: user.isAdmin,
      role: user.isAdmin ? 'ADMIN' : 'USER',
    } as any;
  }
}
