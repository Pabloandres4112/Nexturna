import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MetaConnectionEntity, MetaConnectionStatus } from './meta-connection.entity';
import { ConnectMetaDto, MetaConnectionResponseDto } from './meta-connection.dto';

@Injectable()
export class MetaConnectionService {
  private readonly logger = new Logger(MetaConnectionService.name);

  constructor(
    @InjectRepository(MetaConnectionEntity)
    private readonly repo: Repository<MetaConnectionEntity>,
  ) {}

  /**
   * Usado en el hot path del webhook: dado el phone_number_id que manda
   * Meta, resuelve a que negocio pertenece. Solo conexiones CONNECTED
   * cuentan -- una revocada no debe seguir recibiendo mensajes.
   */
  async findBusinessIdByPhoneNumberId(phoneNumberId: string): Promise<string | null> {
    const connection = await this.repo.findOne({
      where: { phoneNumberId, connectionStatus: MetaConnectionStatus.CONNECTED },
    });

    return connection?.businessId ?? null;
  }

  async getForBusiness(businessId: string): Promise<MetaConnectionResponseDto | null> {
    const connection = await this.repo.findOne({ where: { businessId } });
    return connection ? this.toDto(connection) : null;
  }

  async connectManually(
    businessId: string,
    dto: ConnectMetaDto,
  ): Promise<MetaConnectionResponseDto> {
    const existing = await this.repo.findOne({ where: { businessId } });
    const connection = existing ?? this.repo.create({ businessId });

    connection.wabaId = dto.wabaId;
    connection.phoneNumberId = dto.phoneNumberId;
    connection.displayPhoneNumber = dto.displayPhoneNumber ?? null;
    connection.connectionStatus = MetaConnectionStatus.CONNECTED;
    connection.connectedAt = new Date();

    const saved = await this.repo.save(connection);
    this.logger.log(`Negocio ${businessId} conectado a phone_number_id ${dto.phoneNumberId}`);

    return this.toDto(saved);
  }

  private toDto(entity: MetaConnectionEntity): MetaConnectionResponseDto {
    return {
      id: entity.id,
      businessId: entity.businessId,
      wabaId: entity.wabaId,
      phoneNumberId: entity.phoneNumberId,
      displayPhoneNumber: entity.displayPhoneNumber,
      connectionStatus: entity.connectionStatus,
      webhookSubscribed: entity.webhookSubscribed,
      connectedAt: entity.connectedAt,
    };
  }
}
