import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MessageLogService } from '../message-log/message-log.service';
import { MessageDirection, MessageType, MessageStatus } from '../message-log/message-log.entity';
import { CreateMessageLogDto } from '../message-log/message-log.dto';
import * as crypto from 'crypto';

/**
 * Servicio para procesar webhooks de Meta Cloud API.
 * Valida firmas HMAC-SHA256 y despacha eventos a handlers correspondientes.
 */
@Injectable()
export class WebhookService {
  private readonly logger = new Logger('WebhookService');

  constructor(
    private readonly configService: ConfigService,
    private readonly messageLogService: MessageLogService,
  ) {}

  /**
   * Valida la firma HMAC-SHA256 del webhook según Meta docs.
   * GET Request: X-Hub-Signature header format: sha1=<signature>
   * POST Request: X-Hub-Signature header format: sha256=<signature>
   *
   * @param bodyString - Raw body string (no parsed JSON)
   * @param xHubSignature - Header value: "sha256=abc123..."
   * @returns true si la firma es válida
   */
  validateSignature(bodyString: string, xHubSignature: string): boolean {
    try {
      // Obtener el app secret de variables de entorno
      const appSecret = this.configService.get<string>('WHATSAPP_APP_SECRET');

      if (!appSecret) {
        this.logger.warn('WHATSAPP_APP_SECRET no configurado - webhooks sin verificación de firma');
        return false;
      }

      // Extraer el hash del header
      const [algorithm, hash] = xHubSignature.split('=');

      if (algorithm !== 'sha256') {
        this.logger.warn(`Algoritmo inesperado: ${algorithm}`);
        return false;
      }

      // Calcular HMAC-SHA256
      const hmac = crypto.createHmac('sha256', appSecret).update(bodyString, 'utf-8').digest('hex');

      // Comparar con constante-time para evitar timing attacks
      return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(hmac));
    } catch (error) {
      this.logger.error(`Error validando firma webhook: ${error}`);
      return false;
    }
  }

  /**
   * Procesa un evento de mensaje recibido de Meta.
   * Extrae el texto, número origen, y guarda en MessageLog.
   */
  async handleMessageEvent(businessId: string, userId: string, messageData: any): Promise<void> {
    try {
      const { from, id, text } = messageData;

      if (!from || !id || !text?.body) {
        this.logger.warn('Mensaje incompleto recibido', messageData);
        return;
      }

      // Crear log del mensaje recibido
      const logDto: CreateMessageLogDto = {
        phoneNumber: from,
        messageText: text.body,
        direction: MessageDirection.RECEIVED,
        messageType: MessageType.INCOMING,
        status: MessageStatus.DELIVERED,
        whatsappMessageId: id,
      };

      await this.messageLogService.createLog(businessId, userId, logDto);

      this.logger.debug(`Mensaje recibido de ${from}: ${text.body}`);

      // Aquí irían handlers adicionales:
      // - Procesar confirmaciones de cita
      // - Actualizar estado de cliente
      // - Trigger automático para respuestas
    } catch (error) {
      this.logger.error(`Error procesando mensaje: ${error}`);
    }
  }

  /**
   * Procesa un evento de estado de mensaje (SENT, DELIVERED, READ, FAILED).
   * Actualiza el log del mensaje con el nuevo estado.
   */
  async handleStatusEvent(_businessId: string, statusData: any): Promise<void> {
    try {
      const { id, status } = statusData;

      if (!id || !status) {
        this.logger.warn('Status event incompleto', statusData);
        return;
      }

      // Mapear status de Meta a nuestros estados
      const statusMap: Record<string, MessageStatus> = {
        sent: MessageStatus.SENT,
        delivered: MessageStatus.DELIVERED,
        read: MessageStatus.DELIVERED, // Tratamos READ como DELIVERED
        failed: MessageStatus.FAILED,
      };

      const mappedStatus = statusMap[status] ?? MessageStatus.SENT;

      // Buscar el log original del mensaje y actualizarlo
      // En producción, guardaríamos el whatsappMessageId en la búsqueda
      this.logger.debug(`Status actualizado para ${id}: ${mappedStatus}`);

      // Aquí iría lógica para actualizar el mensaje original
      // await this.messageLogService.updateLogByWhatsappMessageId(id, { status: mappedStatus });
    } catch (error) {
      this.logger.error(`Error procesando status: ${error}`);
    }
  }

  /**
   * Dispatcher principal que ruteael evento a handlers específicos.
   */
  async dispatchEvent(businessId: string, userId: string, entry: any): Promise<void> {
    const changes = entry.changes || [];

    for (const change of changes) {
      const { field, value } = change;

      // Campo: messages_status
      if (field === 'messages_status') {
        const statuses = value.statuses || [];
        for (const status of statuses) {
          await this.handleStatusEvent(businessId, status);
        }
      }

      // Campo: messages (nuevos mensajes recibidos)
      if (field === 'messages') {
        const messages = value.messages || [];
        for (const message of messages) {
          await this.handleMessageEvent(businessId, userId, message);
        }
      }
    }
  }

  /**
   * Procesa el webhook POST de Meta.
   * Valida firma, extrae los eventos, y despacha a handlers.
   */
  async processWebhook(
    businessId: string,
    userId: string,
    bodyString: string,
    xHubSignature: string,
    bodyJson: any,
  ): Promise<{ success: boolean; message: string }> {
    // Validar firma (deshabilitado si APP_SECRET no está configurado)
    if (xHubSignature && !this.validateSignature(bodyString, xHubSignature)) {
      throw new BadRequestException('Firma del webhook inválida');
    }

    // Verificar estructura básica
    if (!bodyJson.object || bodyJson.object !== 'whatsapp_business_account') {
      throw new BadRequestException('Webhook object inválido');
    }

    // Procesar cada entrada
    const entries = bodyJson.entry || [];
    for (const entry of entries) {
      await this.dispatchEvent(businessId, userId, entry);
    }

    return {
      success: true,
      message: 'Webhook procesado correctamente',
    };
  }
}
