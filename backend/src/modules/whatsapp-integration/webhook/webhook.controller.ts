import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Headers,
  Req,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { WhatsAppWebhookDto, WebhookResponseDto } from './webhook.dto';

/**
 * Webhook controller para Meta Cloud API de WhatsApp.
 *
 * Endpoints:
 * - GET /webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=...&hub.challenge=...
 *   Usado por Meta para verificar que nuestro servidor es real.
 *
 * - POST /webhooks/whatsapp
 *   Donde Meta envía eventos (mensajes recibidos, status updates, etc).
 *   Requiere header: X-Hub-Signature: sha256=<hmac>
 */
@Controller('webhooks/whatsapp')
export class WebhookController {
  private readonly logger = new Logger('WebhookController');

  constructor(private readonly webhookService: WebhookService) {}

  /**
   * GET /webhooks/whatsapp
   * Verificación de webhook - Meta envía un challenge que debemos retornar.
   *
   * @param hubMode "subscribe"
   * @param hubChallenge El challenge que debemos retornar
   * @param hubVerifyToken Token que configuramos en Meta
   * @returns El challenge si el token es válido
   */
  @Get()
  verifyWebhook(
    @Query('hub.mode') hubMode: string,
    @Query('hub.challenge') hubChallenge: string,
    @Query('hub.verify_token') hubVerifyToken: string,
  ): string {
    const configuredToken = process.env.WHATSAPP_VERIFY_TOKEN || 'turnoya-webhook-token';

    if (hubMode !== 'subscribe') {
      throw new BadRequestException('Invalid hub.mode');
    }

    if (hubVerifyToken !== configuredToken) {
      this.logger.warn(`Intento de verificación con token inválido`);
      throw new BadRequestException('Invalid verify token');
    }

    this.logger.debug('Webhook verificado exitosamente');
    return hubChallenge;
  }

  /**
   * POST /webhooks/whatsapp
   * Recibe eventos de Meta (mensajes, status updates, etc).
   *
   * @param body El payload del webhook
   * @param xHubSignature Header de firma: "sha256=abc123..."
   * @param req La request (para acceder a raw body)
   * @returns Respuesta de confirmación
   */
  @Post()
  async handleWebhook(
    @Body() body: WhatsAppWebhookDto,
    @Headers('x-hub-signature') xHubSignature: string,
    @Req() req: any,
  ): Promise<WebhookResponseDto> {
    try {
      // Para validar la firma necesitamos el raw body como string
      const rawBody = req.rawBody || JSON.stringify(body);

      // TODO: Extraer businessId y userId de la request
      // En producción, esto vendría de un query param o de un lookup en DB
      // basado en el phone_number_id de Meta
      const businessId = 'business-123'; // Placeholder
      const userId = 'user-123'; // Placeholder

      // Procesar el webhook
      const result = await this.webhookService.processWebhook(
        businessId,
        userId,
        rawBody,
        xHubSignature,
        body,
      );

      this.logger.debug(`Webhook procesado: ${result.message}`);

      return {
        success: true,
        message: 'Webhook recibido',
      };
    } catch (error) {
      this.logger.error(`Error en webhook: ${error}`);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Siempre retornamos 200 a Meta para evitar reintentos
      return {
        success: false,
        message: `Error: ${errorMessage}`,
      };
    }
  }
}
