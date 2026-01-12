import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import type { AuthenticatedAgent } from './dto/auth.dto';
import { Public } from './decorators';
import { JwtAuthGuard } from './guards';
import { CurrentUser } from './decorators';

@ApiTags('Auth')
@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Public()
  @ApiOperation({
    summary: 'Register new agent',
    description: 'Creates a new agent account. Returns agent profile (no token - must login separately).',
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'Agent registered successfully' })
  @ApiResponse({ status: 409, description: 'Agent with email already exists' })
  async register(@Body() dto: RegisterDto) {
    const agent = await this.authService.register(dto);
    return {
      success: true,
      agent,
    };
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Agent login',
    description: 'Authenticates agent and returns JWT tokens.',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
        expiresIn: { type: 'number', example: 900 },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto) {
    const tokens = await this.authService.login(dto);
    return {
      success: true,
      ...tokens,
    };
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Uses refresh token to get new access token.',
  })
  @ApiResponse({ status: 200, description: 'Token refreshed' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(@Body('refreshToken') refreshToken: string) {
    const tokens = await this.authService.refreshTokens(refreshToken);
    return {
      success: true,
      ...tokens,
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Agent logout',
    description: 'Logs out agent and invalidates session.',
  })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(@CurrentUser('id') agentId: string) {
    await this.authService.logout(agentId);
    return {
      success: true,
      message: 'Logged out successfully',
    };
  }

  @Post('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get current agent',
    description: 'Returns the authenticated agent profile.',
  })
  @ApiResponse({ status: 200, description: 'Agent profile' })
  async me(@CurrentUser() agent: AuthenticatedAgent) {
    return {
      success: true,
      agent,
    };
  }
}
