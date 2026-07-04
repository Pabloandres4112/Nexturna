import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto, UserSettingsDto } from './user.dto';
import { UserEntity } from './user.entity';
import { UserRole } from './user-role.enum';

describe('UserService', () => {
  let service: UserService;
  const mockRepository = {
    find: jest.fn().mockResolvedValue([
      {
        id: 'user-1',
        role: UserRole.BUSINESS_OWNER,
        businessName: 'Mi Negocio',
        whatsappNumber: '+573001234567',
        email: 'test@example.com',
        settings: {
          averageServiceTime: 30,
          automationEnabled: true,
          excludedContacts: [],
          maxDaysAhead: 7,
          queuePaused: false,
        },
      },
    ]),
    findOne: jest.fn().mockImplementation(async ({ where: { id } }) => ({
      id,
      role: UserRole.BUSINESS_OWNER,
      businessName: 'Mi Negocio',
      whatsappNumber: '+573001234567',
      email: 'test@example.com',
      settings: {
        averageServiceTime: 30,
        automationEnabled: true,
        excludedContacts: [],
        maxDaysAhead: 7,
        queuePaused: false,
      },
    })),
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest.fn().mockImplementation(async (entity) => ({
      id: entity.id ?? 'saved-user-id',
      ...entity,
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllUsers', () => {
    it('should return users list', async () => {
      const result = await service.getAllUsers();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('getUser', () => {
    it('should return user data with the provided id', async () => {
      const result = await service.getUser('user-123');

      expect(result).toHaveProperty('id', 'user-123');
      expect(result).toHaveProperty('role', UserRole.BUSINESS_OWNER);
    });

    it('should return an object with businessName, whatsappNumber and settings fields', async () => {
      const result = await service.getUser('abc');

      expect(result).toHaveProperty('businessName');
      expect(result).toHaveProperty('whatsappNumber');
      expect(result).toHaveProperty('settings');
    });
  });

  describe('createUser', () => {
    it('should return success true', async () => {
      const dto: CreateUserDto = {
        businessName: 'Mi Negocio',
        whatsappNumber: '+573001234567',
      };

      const result = await service.createUser(dto);

      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
    });

    it('should return a userId', async () => {
      const dto: CreateUserDto = {
        businessName: 'Negocio Test',
        whatsappNumber: '+573009876543',
        email: 'test@example.com',
      };

      const result = await service.createUser(dto);

      expect(result.userId).toBeDefined();
      expect(typeof result.userId).toBe('string');
    });
  });

  describe('updateUser', () => {
    it('should return success true when updating a user', async () => {
      const dto: UpdateUserDto = { businessName: 'Nuevo Nombre' };
      const result = await service.updateUser('user-123', dto);

      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
    });

    it('should return success with settings update', async () => {
      const settings: UserSettingsDto = {
        averageServiceTime: 20,
        automationEnabled: false,
      };
      const dto: UpdateUserDto = { settings };
      const result = await service.updateUser('user-456', dto);

      expect(result.success).toBe(true);
    });
  });

  describe('getUserSettings', () => {
    it('should return default settings shape', async () => {
      const result = await service.getUserSettings('user-123');

      expect(result).toHaveProperty('averageServiceTime');
      expect(result).toHaveProperty('automationEnabled');
      expect(result).toHaveProperty('excludedContacts');
      expect(result).toHaveProperty('maxDaysAhead');
      expect(result).toHaveProperty('queuePaused');
    });

    it('should return numeric averageServiceTime', async () => {
      const result = await service.getUserSettings('user-123');

      expect(typeof result.averageServiceTime).toBe('number');
    });

    it('should return boolean automationEnabled', async () => {
      const result = await service.getUserSettings('user-123');

      expect(typeof result.automationEnabled).toBe('boolean');
    });

    it('should return an array for excludedContacts', async () => {
      const result = await service.getUserSettings('user-123');

      expect(Array.isArray(result.excludedContacts)).toBe(true);
    });

    it('should return numeric maxDaysAhead', async () => {
      const result = await service.getUserSettings('user-123');

      expect(typeof result.maxDaysAhead).toBe('number');
    });

    it('should sanitize invalid queuePaused values from persisted settings', async () => {
      mockRepository.findOne.mockResolvedValueOnce({
        id: 'user-123',
        role: UserRole.PLATFORM_ADMIN,
        businessName: 'Negocio roto',
        whatsappNumber: '+573001234567',
        email: 'test@example.com',
        settings: {
          averageServiceTime: 30,
          automationEnabled: true,
          excludedContacts: [],
          maxDaysAhead: 7,
          queuePaused: 7,
        },
      });

      const result = await service.getUserSettings('user-123');

      expect(result.queuePaused).toBe(false);
    });
  });
});
