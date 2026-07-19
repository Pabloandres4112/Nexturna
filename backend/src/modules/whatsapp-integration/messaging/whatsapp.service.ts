import { Injectable, Logger } from '@nestjs/common';
import { WhatsAppApiClient, WhatsAppSendResult } from './whatsapp-api.client';

/**
 * Sabe QUE decir para cada evento de negocio (turnos). El COMO enviarlo
 * (HTTP, reintentos, autenticacion) vive en WhatsAppApiClient.
 */
@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  constructor(private readonly apiClient: WhatsAppApiClient) {}

  async sendMessage(phoneNumber: string, message: string): Promise<WhatsAppSendResult> {
    return this.apiClient.sendMessage(phoneNumber, message);
  }

  async sendQueueConfirmation(phoneNumber: string, position: number, estimatedTimeMinutes: number) {
    const message = `¡Turno confirmado! 🎉\n\nEstás en la posición ${position}.\nTiempo estimado de espera: ${estimatedTimeMinutes} minutos.`;
    return this.sendMessage(phoneNumber, message);
  }

  async sendTurnApproaching(phoneNumber: string) {
    const message = `¡Tu turno está próximo! 🔔\nPor favor prepárate para ser atendido.`;
    return this.sendMessage(phoneNumber, message);
  }

  async sendTurnReady(phoneNumber: string) {
    const message = `¡Es tu turno! \nPor favor dirígete al punto de atención.`;
    return this.sendMessage(phoneNumber, message);
  }

  async handleIncomingMessage(webhookData: unknown) {
    this.logger.log(`Mensaje recibido por webhook WhatsApp: ${JSON.stringify(webhookData)}`);
    return {
      processed: true,
    };
  }
}
