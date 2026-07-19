import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MetaConnectionService } from './meta-connection.service';
import { MetaConnectionEntity, MetaConnectionStatus } from './meta-connection.entity';

describe('MetaConnectionService', () => {
  let service: MetaConnectionService;
  let mockRepo: any;

  beforeEach(async () => {
    mockRepo = {
      findOne: jest.fn(),
      create: jest.fn((data) => data),
      save: jest.fn((data) => Promise.resolve({ id: 'conn-1', ...data })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetaConnectionService,
        { provide: getRepositoryToken(MetaConnectionEntity), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<MetaConnectionService>(MetaConnectionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findBusinessIdByPhoneNumberId', () => {
    it('retorna el businessId cuando hay una conexion CONNECTED', async () => {
      mockRepo.findOne.mockResolvedValue({ businessId: 'biz-1' });

      const result = await service.findBusinessIdByPhoneNumberId('123456');

      expect(result).toBe('biz-1');
      expect(mockRepo.findOne).toHaveBeenCalledWith({
        where: { phoneNumberId: '123456', connectionStatus: MetaConnectionStatus.CONNECTED },
      });
    });

    it('retorna null cuando no existe conexion para ese phone_number_id', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      const result = await service.findBusinessIdByPhoneNumberId('desconocido');

      expect(result).toBeNull();
    });
  });

  describe('connectManually', () => {
    it('crea una conexion nueva si el negocio no tenia ninguna', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      const result = await service.connectManually('biz-1', {
        wabaId: 'waba-1',
        phoneNumberId: 'phone-1',
      });

      expect(result.businessId).toBe('biz-1');
      expect(result.connectionStatus).toBe(MetaConnectionStatus.CONNECTED);
      expect(result.connectedAt).toBeInstanceOf(Date);
    });

    it('actualiza la conexion existente en vez de duplicarla', async () => {
      mockRepo.findOne.mockResolvedValue({
        id: 'conn-1',
        businessId: 'biz-1',
        wabaId: 'waba-old',
        phoneNumberId: 'phone-old',
      });

      const result = await service.connectManually('biz-1', {
        wabaId: 'waba-new',
        phoneNumberId: 'phone-new',
      });

      expect(result.wabaId).toBe('waba-new');
      expect(result.phoneNumberId).toBe('phone-new');
      expect(mockRepo.create).not.toHaveBeenCalled();
    });
  });
});
