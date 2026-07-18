import { Test, TestingModule } from '@nestjs/testing';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppApiClient } from './whatsapp-api.client';

describe('WhatsAppService', () => {
  let service: WhatsAppService;
  let apiClient: { sendMessage: jest.Mock };

  beforeEach(async () => {
    apiClient = {
      sendMessage: jest.fn().mockResolvedValue({ success: true, messageId: 'wamid.1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [WhatsAppService, { provide: WhatsAppApiClient, useValue: apiClient }],
    }).compile();

    service = module.get<WhatsAppService>(WhatsAppService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('sendMessage delegates directly to WhatsAppApiClient', async () => {
    await service.sendMessage('+573001111111', 'Hola');

    expect(apiClient.sendMessage).toHaveBeenCalledWith('+573001111111', 'Hola');
  });

  it('sendQueueConfirmation compone el mensaje con posicion y tiempo estimado', async () => {
    await service.sendQueueConfirmation('+573001111111', 3, 15);

    const [phoneNumber, message] = apiClient.sendMessage.mock.calls[0];
    expect(phoneNumber).toBe('+573001111111');
    expect(message).toContain('posición 3');
    expect(message).toContain('15 minutos');
  });

  it('sendTurnReady envia el aviso de turno listo', async () => {
    await service.sendTurnReady('+573001111111');

    const [, message] = apiClient.sendMessage.mock.calls[0];
    expect(message).toContain('Es tu turno');
  });
});
