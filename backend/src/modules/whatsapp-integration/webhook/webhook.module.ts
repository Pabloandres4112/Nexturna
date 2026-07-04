import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { MessageLogModule } from '../message-log/message-log.module';

@Module({
  imports: [MessageLogModule],
  controllers: [WebhookController],
  providers: [WebhookService],
})
export class WebhookModule {}
