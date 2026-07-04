import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageLogEntity } from './message-log.entity';
import { MessageLogService } from './message-log.service';
import { MessageLogController } from './message-log.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MessageLogEntity])],
  providers: [MessageLogService],
  controllers: [MessageLogController],
  exports: [MessageLogService],
})
export class MessageLogModule {}
