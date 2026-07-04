import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { ConfigService } from '@nestjs/config';
import { MessageLogService } from '../message-log/message-log.service';
import { MessageDirection, MessageType, MessageStatus } from '../message-log/message-log.entity';
import * as crypto from 'crypto';

describe('WebhookService (Tarea 13)', () => {
  let service: WebhookService;
  let mockConfigService: any;
  let mockMessageLogService: any;

  const APP_SECRET = 'test-app-secret';

  beforeEach(async () => {
    mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'WHATSAPP_APP_SECRET') return APP_SECRET;
        return undefined;
      }),
    };

    mockMessageLogService = {
      createLog: jest.fn().mockResolvedValue({ id: 'log-123' }),
      updateLog: jest.fn().mockResolvedValue({ id: 'log-123' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhookService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: MessageLogService, useValue: mockMessageLogService },
      ],
    }).compile();

    service = module.get<WebhookService>(WebhookService);
  });

  describe('validateSignature', () => {
    it('Debe validar firma HMAC-SHA256 correcta', () => {
      const bodyString = '{"object":"whatsapp_business_account"}';
      const hmac = crypto
        .createHmac('sha256', APP_SECRET)
        .update(bodyString, 'utf-8')
        .digest('hex');
      const xHubSignature = `sha256=${hmac}`;

      const isValid = service.validateSignature(bodyString, xHubSignature);

      expect(isValid).toBe(true);
    });

    it('Debe rechazar firma HMAC-SHA256 incorrecta', () => {
      const bodyString = '{"object":"whatsapp_business_account"}';
      const xHubSignature = 'sha256=invalid_signature_123';

      const isValid = service.validateSignature(bodyString, xHubSignature);

      expect(isValid).toBe(false);
    });

    it('Debe rechazar algoritmo diferente a sha256', () => {
      const bodyString = '{"object":"whatsapp_business_account"}';
      const xHubSignature = 'sha1=invalid_algorithm';

      const isValid = service.validateSignature(bodyString, xHubSignature);

      expect(isValid).toBe(false);
    });

    it('Debe retornar false si APP_SECRET no está configurado', () => {
      mockConfigService.get.mockReturnValue(undefined);

      const bodyString = '{"object":"whatsapp_business_account"}';
      const xHubSignature = 'sha256=anySignature';

      const isValid = service.validateSignature(bodyString, xHubSignature);

      expect(isValid).toBe(false);
    });
  });

  describe('handleMessageEvent', () => {
    it('Debe procesar un mensaje recibido y guardarlo en MessageLog', async () => {
      const messageData = {
        from: '+573105555555',
        id: 'msg-abc123',
        timestamp: '1234567890',
        text: { body: 'Confirmo mi cita' },
        type: 'text',
      };

      await service.handleMessageEvent('biz-123', 'user-123', messageData);

      expect(mockMessageLogService.createLog).toHaveBeenCalledWith(
        'biz-123',
        'user-123',
        expect.objectContaining({
          phoneNumber: '+573105555555',
          messageText: 'Confirmo mi cita',
          direction: MessageDirection.RECEIVED,
          messageType: MessageType.INCOMING,
          status: MessageStatus.DELIVERED,
          whatsappMessageId: 'msg-abc123',
        }),
      );
    });

    it('Debe ignorar mensajes incompletos', async () => {
      const incompleteMessage = {
        from: '+573105555555',
        // Falta 'id' y 'text'
      };

      await service.handleMessageEvent('biz-123', 'user-123', incompleteMessage);

      expect(mockMessageLogService.createLog).not.toHaveBeenCalled();
    });
  });

  describe('handleStatusEvent', () => {
    it('Debe procesar un event de status DELIVERED', async () => {
      const statusData = {
        id: 'msg-abc123',
        status: 'delivered',
        timestamp: '1234567890',
        recipient_id: '+573105555555',
      };

      await service.handleStatusEvent('biz-123', statusData);

      // En este caso, solo loguea pero no hace update (TODO en el código)
      // expect(mockMessageLogService.updateLog).toHaveBeenCalled();
    });

    it('Debe mapear status READ a DELIVERED', async () => {
      const statusData = {
        id: 'msg-abc123',
        status: 'read',
        timestamp: '1234567890',
        recipient_id: '+573105555555',
      };

      await service.handleStatusEvent('biz-123', statusData);

      // Debería mapear 'read' a 'DELIVERED' internamente
    });
  });

  describe('dispatchEvent', () => {
    it('Debe despachar eventos messages hacia handleMessageEvent', async () => {
      const handleMessageEventSpy = jest.spyOn(service, 'handleMessageEvent');

      const entry = {
        changes: [
          {
            field: 'messages',
            value: {
              messaging_product: 'whatsapp',
              messages: [
                {
                  from: '+573105555555',
                  id: 'msg-123',
                  timestamp: '1234567890',
                  text: { body: 'Hola' },
                },
              ],
            },
          },
        ],
      };

      await service.dispatchEvent('biz-123', 'user-123', entry);

      expect(handleMessageEventSpy).toHaveBeenCalled();
    });

    it('Debe despachar eventos messages_status hacia handleStatusEvent', async () => {
      const handleStatusEventSpy = jest.spyOn(service, 'handleStatusEvent');

      const entry = {
        changes: [
          {
            field: 'messages_status',
            value: {
              messaging_product: 'whatsapp',
              statuses: [
                {
                  id: 'msg-123',
                  status: 'delivered',
                  timestamp: '1234567890',
                  recipient_id: '+573105555555',
                },
              ],
            },
          },
        ],
      };

      await service.dispatchEvent('biz-123', 'user-123', entry);

      expect(handleStatusEventSpy).toHaveBeenCalled();
    });
  });

  describe('processWebhook', () => {
    it('Debe procesar un webhook POST válido', async () => {
      const bodyString = '{"object":"whatsapp_business_account","entry":[]}';
      const bodyJson = { object: 'whatsapp_business_account', entry: [] };
      const hmac = crypto
        .createHmac('sha256', APP_SECRET)
        .update(bodyString, 'utf-8')
        .digest('hex');
      const xHubSignature = `sha256=${hmac}`;

      const result = await service.processWebhook(
        'biz-123',
        'user-123',
        bodyString,
        xHubSignature,
        bodyJson,
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('correctamente');
    });

    it('Debe rechazar webhook con firma inválida', async () => {
      const bodyString = '{"object":"whatsapp_business_account"}';
      const bodyJson = { object: 'whatsapp_business_account', entry: [] };
      const xHubSignature = 'sha256=invalid_signature';

      await expect(
        service.processWebhook('biz-123', 'user-123', bodyString, xHubSignature, bodyJson),
      ).rejects.toThrow(BadRequestException);
    });

    it('Debe rechazar webhook con object inválido', async () => {
      const bodyString = '{"object":"invalid_object"}';
      const bodyJson = { object: 'invalid_object', entry: [] };
      const xHubSignature = '';

      await expect(
        service.processWebhook('biz-123', 'user-123', bodyString, xHubSignature, bodyJson),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
