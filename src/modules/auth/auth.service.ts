import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AgentEntity } from '../agent/entities/agent.entity';
import { LoginDto, RegisterDto, JwtPayload, TokenResponse, AuthenticatedAgent } from './dto/auth.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly saltRounds = 10;

  constructor(
    @InjectRepository(AgentEntity)
    private readonly agentRepo: Repository<AgentEntity>,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Register a new agent
   */
  async register(dto: RegisterDto): Promise<AuthenticatedAgent> {
    // Check if agent exists
    const existing = await this.agentRepo.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Agent with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, this.saltRounds);

    // Create agent
    const agent = this.agentRepo.create({
      email: dto.email,
      password: hashedPassword,
      name: dto.name,
      status: 'offline',
    });
    await this.agentRepo.save(agent);

    this.logger.log(`Agent registered: ${dto.email}`);

    return {
      id: agent.id,
      email: agent.email,
      name: agent.name,
      role: 'agent',
    };
  }

  /**
   * Validate agent credentials for local strategy
   */
  async validateAgent(email: string, password: string): Promise<AuthenticatedAgent | null> {
    const agent = await this.agentRepo.findOne({ where: { email } });
    if (!agent) {
      return null;
    }

    const isValid = await bcrypt.compare(password, agent.password);
    if (!isValid) {
      return null;
    }

    return {
      id: agent.id,
      email: agent.email,
      name: agent.name,
      role: 'agent',
    };
  }

  /**
   * Login and generate tokens
   */
  async login(dto: LoginDto): Promise<TokenResponse> {
    const agent = await this.validateAgent(dto.email, dto.password);
    if (!agent) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update agent status to online
    await this.agentRepo.update(agent.id, {
      status: 'online',
      lastActiveAt: new Date(),
    });

    const tokens = await this.generateTokens(agent);
    this.logger.log(`Agent logged in: ${dto.email}`);

    return tokens;
  }

  /**
   * Generate access and refresh tokens
   */
  async generateTokens(agent: AuthenticatedAgent): Promise<TokenResponse> {
    const payload: JwtPayload = {
      sub: agent.id,
      email: agent.email,
      role: agent.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: process.env['JWT_EXPIRES_IN'] || '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env['JWT_REFRESH_SECRET'] || 'refresh-secret-change-me',
      expiresIn: process.env['JWT_REFRESH_EXPIRES_IN'] || '7d',
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshTokens(refreshToken: string): Promise<TokenResponse> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: process.env['JWT_REFRESH_SECRET'] || 'refresh-secret-change-me',
      });

      const agent = await this.agentRepo.findOne({ where: { id: payload.sub } });
      if (!agent) {
        throw new UnauthorizedException('Agent not found');
      }

      return this.generateTokens({
        id: agent.id,
        email: agent.email,
        name: agent.name,
        role: 'agent',
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Logout agent
   */
  async logout(agentId: string): Promise<void> {
    await this.agentRepo.update(agentId, {
      status: 'offline',
      lastActiveAt: new Date(),
    });
    this.logger.log(`Agent logged out: ${agentId}`);
  }

  /**
   * Get agent by ID (for JWT strategy)
   */
  async getAgentById(id: string): Promise<AuthenticatedAgent | null> {
    const agent = await this.agentRepo.findOne({ where: { id } });
    if (!agent) {
      return null;
    }

    return {
      id: agent.id,
      email: agent.email,
      name: agent.name,
      role: 'agent',
    };
  }
}
