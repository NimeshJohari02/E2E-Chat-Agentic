import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ConversationEntity, MessageEntity } from './entities/chat.entity';
import { ModelProviderFactory } from './providers';

@Module({
  imports: [TypeOrmModule.forFeature([ConversationEntity, MessageEntity])],
  controllers: [ChatController],
  providers: [ChatService, ModelProviderFactory],
  exports: [ChatService, ModelProviderFactory],
})
export class ChatModule {}
