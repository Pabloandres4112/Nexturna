import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '@identity/users/user.entity';
import { QueueEntity } from './queue/queue.entity';
import { QueueController } from './queue/queue.controller';
import { QueueService } from './queue/queue.service';
import { WhatsAppContactEntity } from './contacts/whatsapp-contact.entity';

/**
 * Bounded context de agenda: turnos y contactos de WhatsApp asociados a ellos.
 */
@Module({
  imports: [TypeOrmModule.forFeature([QueueEntity, WhatsAppContactEntity, UserEntity])],
  controllers: [QueueController],
  providers: [QueueService],
  exports: [QueueService],
})
export class SchedulingModule {}
