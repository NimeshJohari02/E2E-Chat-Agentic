import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { AgentEntity, QueueEntryEntity } from './entities/agent.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AgentEntity, QueueEntryEntity])],
  controllers: [AgentController],
  providers: [AgentService],
  exports: [AgentService],
})
export class AgentModule {}
