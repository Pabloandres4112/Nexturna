import { Module } from '@nestjs/common';
import { MessageLogModule } from './message-log/message-log.module';
import { WebhookModule } from './webhook/webhook.module';
import { MetaConnectionModule } from './connection/meta-connection.module';
import { WhatsAppService } from './messaging/whatsapp.service';
import { WhatsAppApiClient } from './messaging/whatsapp-api.client';
import { WhatsAppController } from './messaging/whatsapp.controller';

/**
 * Bounded context de integracion con Meta: mensajeria, webhook, conexiones
 * por negocio y su historial.
 */
@Module({
  imports: [MessageLogModule, MetaConnectionModule, WebhookModule],
  controllers: [WhatsAppController],
  providers: [WhatsAppApiClient, WhatsAppService],
  exports: [WhatsAppService, MessageLogModule, MetaConnectionModule],
})
export class WhatsappIntegrationModule {}
