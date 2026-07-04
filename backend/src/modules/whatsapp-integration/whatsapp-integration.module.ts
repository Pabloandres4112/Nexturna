import { Module } from '@nestjs/common';
import { MessageLogModule } from './message-log/message-log.module';
import { WebhookModule } from './webhook/webhook.module';
import { WhatsAppService } from './messaging/whatsapp.service';

/**
 * Bounded context de integracion con Meta: mensajeria, webhook y su historial.
 */
@Module({
  imports: [MessageLogModule, WebhookModule],
  providers: [WhatsAppService],
  exports: [WhatsAppService, MessageLogModule],
})
export class WhatsappIntegrationModule {}
