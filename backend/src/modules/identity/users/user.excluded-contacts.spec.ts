import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UserService } from './user.service';
import { UserEntity } from './user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('UserService - Excluded Contacts (Tarea 14)', () => {
  let service: UserService;
  let mockUserRepository: any;

  beforeEach(async () => {
    mockUserRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  describe('addExcludedContact', () => {
    it('Debe agregar un contacto a la lista de exclusión', async () => {
      const userId = 'user-123';
      const phoneNumber = '+573105555555';
      const mockUser = {
        id: userId,
        settings: {
          averageServiceTime: 30,
          automationEnabled: true,
          excludedContacts: [],
          maxDaysAhead: 7,
          queuePaused: false,
        },
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue({
        ...mockUser,
        settings: {
          ...mockUser.settings,
          excludedContacts: [phoneNumber],
        },
      });

      const result = await service.addExcludedContact(userId, phoneNumber);

      expect(result.success).toBe(true);
      expect(result.excludedContacts).toContain(phoneNumber);
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('Debe rechazar si el contacto ya está excluido', async () => {
      const userId = 'user-123';
      const phoneNumber = '+573105555555';
      const mockUser = {
        id: userId,
        settings: {
          averageServiceTime: 30,
          automationEnabled: true,
          excludedContacts: [phoneNumber],
          maxDaysAhead: 7,
          queuePaused: false,
        },
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.addExcludedContact(userId, phoneNumber);

      expect(result.success).toBe(false);
      expect(result.message).toContain('ya está en la lista');
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('Debe lanzar NotFoundException si el usuario no existe', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.addExcludedContact('invalid-user', '+573105555555')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('removeExcludedContact', () => {
    it('Debe remover un contacto de la lista de exclusión', async () => {
      const userId = 'user-123';
      const phoneNumber = '+573105555555';
      const mockUser = {
        id: userId,
        settings: {
          averageServiceTime: 30,
          automationEnabled: true,
          excludedContacts: [phoneNumber, '+573115555555'],
          maxDaysAhead: 7,
          queuePaused: false,
        },
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue({
        ...mockUser,
        settings: {
          ...mockUser.settings,
          excludedContacts: ['+573115555555'],
        },
      });

      const result = await service.removeExcludedContact(userId, phoneNumber);

      expect(result.success).toBe(true);
      expect(result.excludedContacts).not.toContain(phoneNumber);
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('Debe rechazar si el contacto no está en la lista', async () => {
      const userId = 'user-123';
      const phoneNumber = '+573105555555';
      const mockUser = {
        id: userId,
        settings: {
          averageServiceTime: 30,
          automationEnabled: true,
          excludedContacts: [],
          maxDaysAhead: 7,
          queuePaused: false,
        },
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.removeExcludedContact(userId, phoneNumber);

      expect(result.success).toBe(false);
      expect(result.message).toContain('no está en la lista');
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('getExcludedContacts', () => {
    it('Debe retornar la lista de contactos excluidos', async () => {
      const userId = 'user-123';
      const excludedList = ['+573105555555', '+573115555555'];
      const mockUser = {
        id: userId,
        settings: {
          averageServiceTime: 30,
          automationEnabled: true,
          excludedContacts: excludedList,
          maxDaysAhead: 7,
          queuePaused: false,
        },
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.getExcludedContacts(userId);

      expect(result.success).toBe(true);
      expect(result.excludedContacts).toEqual(excludedList);
    });

    it('Debe retornar lista vacía si no hay exclusiones', async () => {
      const userId = 'user-123';
      const mockUser = {
        id: userId,
        settings: {
          averageServiceTime: 30,
          automationEnabled: true,
          excludedContacts: [],
          maxDaysAhead: 7,
          queuePaused: false,
        },
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.getExcludedContacts(userId);

      expect(result.success).toBe(true);
      expect(result.excludedContacts).toEqual([]);
    });
  });
});
