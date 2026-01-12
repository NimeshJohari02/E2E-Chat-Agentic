import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ConversationEntity, MessageEntity } from './entities/chat.entity';
import { ModelProviderFactory } from './providers';

import { AuthModule } from '../auth/auth.module';
import { ChatGateway } from './chat.gateway';

@Module({
  imports: [
      TypeOrmModule.forFeature([ConversationEntity, MessageEntity]),
      AuthModule,
  ],
  controllers: [ChatController],
  providers: [ChatService, ModelProviderFactory, ChatGateway],
  exports: [ChatService, ModelProviderFactory],
})
export class ChatModule {}
