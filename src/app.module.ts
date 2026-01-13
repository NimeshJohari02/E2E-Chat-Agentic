import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Import modules
import { FaqModule } from './modules/faq';
import { ChatModule } from './modules/chat';
import { AgentModule } from './modules/agent';
import { MetricsModule } from './modules/metrics';
import { AuthModule } from './modules/auth';
import { PrometheusModule } from './common/prometheus/prometheus.module';
import { RedisCacheModule } from './common/cache/redis-cache.module';

// Import config
import { DatabaseConfig } from './config/database.config';

@Module({
  imports: [
    // Load environment variables
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate Limiting (Global: 60 requests per minute)
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 60,
    }]),

    // Database connection
    TypeOrmModule.forRoot(DatabaseConfig),

    // Auth module (must be before protected modules)
    AuthModule,

    // Feature modules
    FaqModule,     // L0 Static Queries
    ChatModule,    // L1 AI Chatbot
    AgentModule,   // L2 Agent Handoff
    MetricsModule, // Efficiency Tracking

    // Observability
    PrometheusModule,

    // Caching
    RedisCacheModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
