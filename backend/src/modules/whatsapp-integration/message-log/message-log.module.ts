import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageLogEntity } from './message-log.entity';
import { MessageLogService } from './message-log.service';
import { MessageLogController } from './message-log.controller';
import { RolesGuard } from '@shared/guards/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([MessageLogEntity])],
  providers: [MessageLogService, RolesGuard],
  controllers: [MessageLogController],
  exports: [MessageLogService],
})
export class MessageLogModule {}
