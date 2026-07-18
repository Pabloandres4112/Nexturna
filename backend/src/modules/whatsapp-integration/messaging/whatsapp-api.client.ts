import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface MetaErrorResponse {
  error?: {
    message?: string;
    code?: number;
    error_subcode?: number;
    type?: string;
  };
}

interface WhatsAppSendResponse {
  messaging_product?: string;
  contacts?: Array<{ input?: string; wa_id?: string }>;
  messages?: Array<{ id?: string }>;
  error?: MetaErrorResponse['error'];
}

export interface WhatsAppSendResult {
  success: boolean;
  messageId: string | null;
  error?: string;
}

/**
 * Transporte HTTP puro hacia la Graph API de WhatsApp: construccion de URL,
 * autenticacion, reintentos con backoff. No sabe nada sobre el contenido de
 * los mensajes de negocio (eso vive en WhatsAppService).
 */
@Injectable()
export class WhatsAppApiClient {
  private readonly logger = new Logger(WhatsAppApiClient.name);

  constructor(private readonly configService: ConfigService) {}

  private getWhatsAppConfig() {
    const apiUrl =
      this.configService.get<string>('WHATSAPP_API_URL') ||
      this.configService.get<string>('WHATSAPP_BASE_URL') ||
      'https://graph.facebook.com/v21.0';

    const token =
      this.configService.get<string>('WHATSAPP_ACCESS_TOKEN') ||
      this.configService.get<string>('WHATSAPP_API_TOKEN') ||
      '';

    const phoneNumberId = this.configService.get<string>('WHATSAPP_PHONE_NUMBER_ID') || '';
    const maxRetries = this.configService.get<number>('WHATSAPP_MAX_RETRIES') ?? 2;
    const retryDelayMs = this.configService.get<number>('WHATSAPP_RETRY_DELAY_MS') ?? 1000;

    return {
      apiUrl,
      token,
      phoneNumberId,
      maxRetries,
      retryDelayMs,
    };
  }

  private isRetryableStatus(status: number): boolean {
    return status === 429 || status >= 500;
  }

  private async wait(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  private buildMessagesUrl(apiUrl: string, phoneNumberId: string): string {
    return `${apiUrl.replace(/\/$/, '')}/${phoneNumberId}/messages`;
  }

  async sendMessage(phoneNumber: string, message: string): Promise<WhatsAppSendResult> {
    const cfg = this.getWhatsAppConfig();

    if (!cfg.token || !cfg.phoneNumberId) {
      this.logger.warn(
        'WhatsApp no configurado: faltan WHATSAPP_ACCESS_TOKEN/WHATSAPP_API_TOKEN o WHATSAPP_PHONE_NUMBER_ID',
      );
      return {
        success: false,
        messageId: null,
        error: 'WhatsApp no configurado',
      };
    }

    const url = this.buildMessagesUrl(cfg.apiUrl, cfg.phoneNumberId);
    const body = {
      messaging_product: 'whatsapp',
      to: phoneNumber,
      type: 'text',
      text: {
        body: message,
      },
    };

    let lastError: string = 'Error desconocido';

    for (let attempt = 0; attempt <= cfg.maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${cfg.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });

        const json = (await response.json().catch(() => ({}))) as
          | WhatsAppSendResponse
          | MetaErrorResponse;

        if (response.ok) {
          return {
            success: true,
            messageId: (json as WhatsAppSendResponse).messages?.[0]?.id ?? null,
          };
        }

        lastError =
          (json as MetaErrorResponse).error?.message || `WhatsApp API error ${response.status}`;

        const shouldRetry = this.isRetryableStatus(response.status) && attempt < cfg.maxRetries;
        if (!shouldRetry) {
          break;
        }

        const backoff = cfg.retryDelayMs * Math.pow(2, attempt);
        this.logger.warn(
          `WhatsApp API fallo intento ${attempt + 1}/${cfg.maxRetries + 1} (${response.status}). Reintentando en ${backoff}ms`,
        );
        await this.wait(backoff);
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Error de red desconocido';

        const shouldRetry = attempt < cfg.maxRetries;
        if (!shouldRetry) {
          break;
        }

        const backoff = cfg.retryDelayMs * Math.pow(2, attempt);
        this.logger.warn(
          `Error de red WhatsApp intento ${attempt + 1}/${cfg.maxRetries + 1}. Reintentando en ${backoff}ms`,
        );
        await this.wait(backoff);
      }
    }

    this.logger.error(`No se pudo enviar mensaje WhatsApp a ${phoneNumber}: ${lastError}`);
    throw new ServiceUnavailableException('No se pudo enviar el mensaje de WhatsApp');
  }
}
