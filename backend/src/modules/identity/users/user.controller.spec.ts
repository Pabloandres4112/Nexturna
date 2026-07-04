import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto } from './user.dto';
import { UserRole } from './user-role.enum';

describe('UserController', () => {
  let controller: UserController;
  let service: UserService;

  const mockUser = {
    id: '11111111-1111-4111-8111-111111111111',
    role: UserRole.BUSINESS_OWNER,
    businessName: 'Mi Negocio',
    whatsappNumber: '+573001234567',
    settings: {},
  };

  const mockSettings = {
    averageServiceTime: 30,
    automationEnabled: true,
    excludedContacts: [],
    maxDaysAhead: 7,
    queuePaused: false,
  };

  const mockService = {
    getUser: jest.fn().mockResolvedValue(mockUser),
    createUser: jest
      .fn()
      .mockResolvedValue({ success: true, message: 'Created', userId: 'new-id' }),
    updateUser: jest.fn().mockResolvedValue({ success: true, message: 'Updated' }),
    getUserSettings: jest.fn().mockResolvedValue(mockSettings),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: mockService }],
    }).compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getUser', () => {
    it('should call service.getUser with the provided id', async () => {
      await controller.getUser('user-1');

      expect(service.getUser).toHaveBeenCalledWith('user-1');
    });

    it('should return user data', async () => {
      const result = await controller.getUser('user-1');

      expect(result).toEqual(mockUser);
    });
  });

  describe('createUser', () => {
    it('should call service.createUser with the provided DTO', async () => {
      const dto: CreateUserDto = {
        businessName: 'Nuevo Negocio',
        whatsappNumber: '+573009999999',
      };

      await controller.createUser(dto);

      expect(service.createUser).toHaveBeenCalledWith(dto);
    });

    it('should return success true', async () => {
      const dto: CreateUserDto = {
        businessName: 'Test',
        whatsappNumber: '+573001234567',
      };

      const result = await controller.createUser(dto);

      expect(result.success).toBe(true);
    });
  });

  describe('updateUser', () => {
    it('should call service.updateUser with id and DTO', async () => {
      const dto: UpdateUserDto = { businessName: 'Actualizado' };

      await controller.updateUser('user-1', dto);

      expect(service.updateUser).toHaveBeenCalledWith('user-1', dto);
    });
  });

  describe('getUserSettings', () => {
    it('should call service.getUserSettings with the provided id', async () => {
      await controller.getUserSettings('user-1');

      expect(service.getUserSettings).toHaveBeenCalledWith('user-1');
    });

    it('should return settings data', async () => {
      const result = await controller.getUserSettings('user-1');

      expect(result).toEqual(mockSettings);
    });
  });
});
