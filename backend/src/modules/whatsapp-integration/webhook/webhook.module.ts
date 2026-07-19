import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { MessageLogModule } from '../message-log/message-log.module';
import { MetaConnectionModule } from '../connection/meta-connection.module';

@Module({
  imports: [MessageLogModule, MetaConnectionModule],
  controllers: [WebhookController],
  providers: [WebhookService],
})
export class WebhookModule {}
