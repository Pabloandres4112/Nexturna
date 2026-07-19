import { Test, TestingModule } from '@nestjs/testing';
import { WhatsAppController } from './whatsapp.controller';
import { WhatsAppService } from './whatsapp.service';
import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard';

describe('WhatsAppController', () => {
  let controller: WhatsAppController;
  let service: WhatsAppService;

  const mockService = {
    sendMessage: jest.fn().mockResolvedValue({ success: true, messageId: 'wamid.test' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WhatsAppController],
      providers: [{ provide: WhatsAppService, useValue: mockService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<WhatsAppController>(WhatsAppController);
    service = module.get<WhatsAppService>(WhatsAppService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('sendTestMessage delega en WhatsAppService.sendMessage con los datos del DTO', async () => {
    const dto = { phoneNumber: '+573001234567', message: 'Hola' };

    const result = await controller.sendTestMessage(dto);

    expect(service.sendMessage).toHaveBeenCalledWith('+573001234567', 'Hola');
    expect(result).toEqual({ success: true, messageId: 'wamid.test' });
  });
});
