import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '@identity/users/user.entity';
import { WhatsappIntegrationModule } from '@whatsapp/whatsapp-integration.module';
import { QueueEntity } from './queue/queue.entity';
import { QueueController } from './queue/queue.controller';
import { QueueService } from './queue/queue.service';
import { WhatsAppContactEntity } from './contacts/whatsapp-contact.entity';

/**
 * Bounded context de agenda: turnos y contactos de WhatsApp asociados a ellos.
 * Importa WhatsappIntegrationModule para poder disparar la confirmacion
 * automatica al crear un turno (QueueService -> WhatsAppService).
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([QueueEntity, WhatsAppContactEntity, UserEntity]),
    WhatsappIntegrationModule,
  ],
  controllers: [QueueController],
  providers: [QueueService],
  exports: [QueueService],
})
export class SchedulingModule {}
