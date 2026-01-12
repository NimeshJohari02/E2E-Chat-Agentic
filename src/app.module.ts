import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Import modules
import { FaqModule } from './modules/faq';
import { ChatModule } from './modules/chat';
import { AgentModule } from './modules/agent';
import { MetricsModule } from './modules/metrics';
import { AuthModule } from './modules/auth';

// Import config
import { DatabaseConfig } from './config/database.config';

@Module({
  imports: [
    // Load environment variables
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Database connection
    TypeOrmModule.forRoot(DatabaseConfig),

    // Auth module (must be before protected modules)
    AuthModule,

    // Feature modules
    FaqModule,     // L0 Static Queries
    ChatModule,    // L1 AI Chatbot
    AgentModule,   // L2 Agent Handoff
    MetricsModule, // Efficiency Tracking
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
