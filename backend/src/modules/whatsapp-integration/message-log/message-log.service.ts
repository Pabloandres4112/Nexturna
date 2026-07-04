import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessageLogEntity, MessageStatus } from './message-log.entity';
import {
  CreateMessageLogDto,
  UpdateMessageLogDto,
  MessageLogResponseDto,
  GetMessageLogsQueryDto,
} from './message-log.dto';

@Injectable()
export class MessageLogService {
  constructor(
    @InjectRepository(MessageLogEntity)
    private readonly messageLogRepository: Repository<MessageLogEntity>,
  ) {}

  /**
   * Crea un nuevo registro de mensaje.
   * Se llama automáticamente después de:
   * - Enviar un mensaje WhatsApp (SENT)
   * - Recibir un webhook de Meta (RECEIVED)
   */
  async createLog(
    businessId: string,
    userId: string,
    dto: CreateMessageLogDto,
  ): Promise<MessageLogResponseDto> {
    const messageLog = this.messageLogRepository.create({
      businessId,
      userId,
      phoneNumber: dto.phoneNumber,
      messageText: dto.messageText,
      direction: dto.direction,
      messageType: dto.messageType,
      status: dto.status ?? MessageStatus.PENDING,
      whatsappMessageId: dto.whatsappMessageId,
      queueId: dto.queueId,
    });

    const saved = await this.messageLogRepository.save(messageLog);

    return this.entityToDto(saved);
  }

  /**
   * Actualiza el estado o messageId de un log existente.
   * Se usa para marcar como DELIVERED cuando Meta confirma entrega.
   */
  async updateLog(logId: string, dto: UpdateMessageLogDto): Promise<MessageLogResponseDto> {
    const log = await this.messageLogRepository.findOne({
      where: { id: logId },
    });

    if (!log) {
      throw new NotFoundException(`Mensaje log ${logId} no encontrado`);
    }

    if (dto.status !== undefined) {
      log.status = dto.status;
    }

    if (dto.whatsappMessageId !== undefined) {
      log.whatsappMessageId = dto.whatsappMessageId;
    }

    const updated = await this.messageLogRepository.save(log);

    return this.entityToDto(updated);
  }

  /**
   * Obtiene historial de mensajes para un negocio con filtros opcionales.
   */
  async getLogsForBusiness(
    businessId: string,
    query: GetMessageLogsQueryDto,
  ): Promise<{ logs: MessageLogResponseDto[]; total: number }> {
    let qb = this.messageLogRepository
      .createQueryBuilder('log')
      .where('log.businessId = :businessId', { businessId });

    if (query.phoneNumber) {
      qb = qb.andWhere('log.phoneNumber = :phoneNumber', { phoneNumber: query.phoneNumber });
    }

    if (query.direction) {
      qb = qb.andWhere('log.direction = :direction', { direction: query.direction });
    }

    if (query.status) {
      qb = qb.andWhere('log.status = :status', { status: query.status });
    }

    const limit = query.limit ?? 50;
    const offset = query.offset ?? 0;

    qb = qb.orderBy('log.createdAt', 'DESC').take(limit).skip(offset);

    const [logs, total] = await qb.getManyAndCount();

    return {
      logs: logs.map((log) => this.entityToDto(log)),
      total,
    };
  }

  /**
   * Obtiene un log específico por ID.
   */
  async getLogById(logId: string): Promise<MessageLogResponseDto> {
    const log = await this.messageLogRepository.findOne({
      where: { id: logId },
    });

    if (!log) {
      throw new NotFoundException(`Mensaje log ${logId} no encontrado`);
    }

    return this.entityToDto(log);
  }

  /**
   * Obtiene todos los logs asociados a un turno (queue item).
   * Útil para auditar toda la comunicación relacionada a un turno.
   */
  async getLogsForQueueItem(queueId: string): Promise<MessageLogResponseDto[]> {
    const logs = await this.messageLogRepository.find({
      where: { queueId },
      order: { createdAt: 'DESC' },
    });

    return logs.map((log) => this.entityToDto(log));
  }

  /**
   * Obtiene todos los logs para un número telefónico específico.
   * Útil para ver historial completo de comunicación con un cliente.
   */
  async getLogsForPhoneNumber(
    businessId: string,
    phoneNumber: string,
  ): Promise<MessageLogResponseDto[]> {
    const logs = await this.messageLogRepository.find({
      where: { businessId, phoneNumber },
      order: { createdAt: 'DESC' },
    });

    return logs.map((log) => this.entityToDto(log));
  }

  /**
   * Cuenta mensajes no entregados (PENDING o FAILED) para un negocio.
   * Se usa para monitoring de fallos de envío.
   */
  async countFailedMessages(businessId: string): Promise<number> {
    return this.messageLogRepository.count({
      where: [
        { businessId, status: MessageStatus.PENDING },
        { businessId, status: MessageStatus.FAILED },
      ],
    });
  }

  /**
   * Marca todos los mensajes PENDING como FAILED si pasaron más de X tiempo.
   * Cleanup job para limpiar mensajes que nunca se entregaron.
   */
  async markStalePendingAsFailed(minutesThreshold: number = 60): Promise<number> {
    const staleSince = new Date(Date.now() - minutesThreshold * 60 * 1000);

    const result = await this.messageLogRepository
      .createQueryBuilder()
      .update(MessageLogEntity)
      .set({ status: MessageStatus.FAILED })
      .where('status = :pending', { pending: MessageStatus.PENDING })
      .andWhere('createdAt < :staleSince', { staleSince })
      .execute();

    return result.affected ?? 0;
  }

  private entityToDto(entity: MessageLogEntity): MessageLogResponseDto {
    return {
      id: entity.id,
      businessId: entity.businessId,
      phoneNumber: entity.phoneNumber,
      messageText: entity.messageText,
      direction: entity.direction,
      messageType: entity.messageType,
      status: entity.status,
      whatsappMessageId: entity.whatsappMessageId,
      userId: entity.userId,
      queueId: entity.queueId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
