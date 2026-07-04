import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ServiceUnavailableException } from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';

describe('WhatsAppService', () => {
  let service: WhatsAppService;

  const baseConfig: Record<string, unknown> = {
    WHATSAPP_API_URL: 'https://graph.facebook.com/v21.0',
    WHATSAPP_ACCESS_TOKEN: 'token_test',
    WHATSAPP_PHONE_NUMBER_ID: '1234567890',
    WHATSAPP_MAX_RETRIES: 2,
    WHATSAPP_RETRY_DELAY_MS: 0,
  };

  const mockConfigService = {
    get: jest.fn((key: string) => baseConfig[key]),
  };

  beforeEach(async () => {
    mockConfigService.get.mockReset();
    mockConfigService.get.mockImplementation((key: string) => baseConfig[key]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [WhatsAppService, { provide: ConfigService, useValue: mockConfigService }],
    }).compile();

    service = module.get<WhatsAppService>(WhatsAppService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should return success false when config is missing', async () => {
    mockConfigService.get.mockImplementation((key: string) => {
      if (key === 'WHATSAPP_PHONE_NUMBER_ID') {
        return '';
      }
      return baseConfig[key];
    });

    const result = await service.sendMessage('+573001111111', 'Hola');

    expect(result.success).toBe(false);
    expect(result.messageId).toBeNull();
    expect(result.error).toBe('WhatsApp no configurado');
  });

  it('should send message successfully and return message id', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ messages: [{ id: 'wamid.test.123' }] }),
    });
    (global as any).fetch = fetchMock;

    const result = await service.sendMessage('+573001111111', 'Hola mundo');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, request] = fetchMock.mock.calls[0];
    expect(url).toBe('https://graph.facebook.com/v21.0/1234567890/messages');
    expect(request.method).toBe('POST');
    expect(request.headers.Authorization).toBe('Bearer token_test');
    expect(result.success).toBe(true);
    expect(result.messageId).toBe('wamid.test.123');
  });

  it('should retry on retryable status and eventually succeed', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: { message: 'Temporal failure' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ messages: [{ id: 'wamid.retried.1' }] }),
      });
    (global as any).fetch = fetchMock;

    const result = await service.sendMessage('+573001111111', 'Mensaje con retry');

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.success).toBe(true);
    expect(result.messageId).toBe('wamid.retried.1');
  });

  it('should throw when retries are exhausted', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ error: { message: 'Service unavailable' } }),
    });
    (global as any).fetch = fetchMock;

    await expect(service.sendMessage('+573001111111', 'Mensaje fallido')).rejects.toThrow(
      ServiceUnavailableException,
    );

    // maxRetries=2 -> total attempts = 3
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
