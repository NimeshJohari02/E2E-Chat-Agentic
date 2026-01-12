import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';
import { JwtPayload, AuthenticatedAgent } from '../dto/auth.dto';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env['JWT_SECRET'] || 'jwt-secret-change-in-production',
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedAgent> {
    const agent = await this.authService.getAgentById(payload.sub);
    if (!agent) {
      throw new UnauthorizedException('Agent not found');
    }
    return agent;
  }
}
