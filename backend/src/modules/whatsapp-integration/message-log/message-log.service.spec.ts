import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { MessageLogService } from './message-log.service';
import {
  MessageLogEntity,
  MessageDirection,
  MessageType,
  MessageStatus,
} from './message-log.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('MessageLogService (Tarea 15)', () => {
  let service: MessageLogService;
  let mockRepository: any;

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessageLogService,
        {
          provide: getRepositoryToken(MessageLogEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<MessageLogService>(MessageLogService);
  });

  describe('createLog', () => {
    it('Debe crear un registro de mensaje SENT', async () => {
      const businessId = 'biz-123';
      const userId = 'user-123';
      const dto = {
        phoneNumber: '+573105555555',
        messageText: 'Hola, tu turno es mañana',
        direction: MessageDirection.SENT,
        messageType: MessageType.APPROACHING,
        status: MessageStatus.PENDING,
        whatsappMessageId: 'msg-abc123',
        queueId: 'queue-456',
      };

      const mockEntity = { id: 'log-789', ...dto, businessId, userId };

      mockRepository.create.mockReturnValue(mockEntity);
      mockRepository.save.mockResolvedValue(mockEntity);

      const result = await service.createLog(businessId, userId, dto);

      expect(result.id).toBe('log-789');
      expect(result.direction).toBe(MessageDirection.SENT);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('Debe crear un registro de mensaje RECEIVED', async () => {
      const businessId = 'biz-123';
      const userId = 'user-123';
      const dto = {
        phoneNumber: '+573105555555',
        messageText: 'Confirmo mi turno',
        direction: MessageDirection.RECEIVED,
        messageType: MessageType.INCOMING,
      };

      const mockEntity = {
        id: 'log-789',
        ...dto,
        businessId,
        userId,
        status: MessageStatus.PENDING,
      };

      mockRepository.create.mockReturnValue(mockEntity);
      mockRepository.save.mockResolvedValue(mockEntity);

      const result = await service.createLog(businessId, userId, dto);

      expect(result.direction).toBe(MessageDirection.RECEIVED);
      expect(result.messageType).toBe(MessageType.INCOMING);
    });
  });

  describe('updateLog', () => {
    it('Debe actualizar el estado de un mensaje a DELIVERED', async () => {
      const logId = 'log-789';
      const mockLog = {
        id: logId,
        status: MessageStatus.PENDING,
        whatsappMessageId: null,
      };

      mockRepository.findOne.mockResolvedValue(mockLog);
      mockRepository.save.mockResolvedValue({
        ...mockLog,
        status: MessageStatus.DELIVERED,
        whatsappMessageId: 'msg-from-meta',
      });

      const result = await service.updateLog(logId, {
        status: MessageStatus.DELIVERED,
        whatsappMessageId: 'msg-from-meta',
      });

      expect(result.status).toBe(MessageStatus.DELIVERED);
      expect(result.whatsappMessageId).toBe('msg-from-meta');
    });

    it('Debe lanzar NotFoundException si el log no existe', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateLog('invalid-id', { status: MessageStatus.FAILED }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getLogsForBusiness', () => {
    it('Debe retornar logs filtrados por negocio', async () => {
      const businessId = 'biz-123';
      const mockLogs = [
        { id: 'log-1', businessId, phoneNumber: '+573105555555', direction: MessageDirection.SENT },
        {
          id: 'log-2',
          businessId,
          phoneNumber: '+573115555555',
          direction: MessageDirection.RECEIVED,
        },
      ];

      const mockQb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockLogs, 2]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.getLogsForBusiness(businessId, {});

      expect(result.logs).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(mockQb.where).toHaveBeenCalledWith('log.businessId = :businessId', { businessId });
    });

    it('Debe filtrar por phoneNumber', async () => {
      const businessId = 'biz-123';
      const phoneNumber = '+573105555555';
      const mockLogs = [{ id: 'log-1', businessId, phoneNumber }];

      const mockQb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockLogs, 1]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.getLogsForBusiness(businessId, { phoneNumber });

      expect(result.logs).toHaveLength(1);
      expect(mockQb.andWhere).toHaveBeenCalledWith('log.phoneNumber = :phoneNumber', {
        phoneNumber,
      });
    });
  });

  describe('getLogsForQueueItem', () => {
    it('Debe retornar todos los logs asociados a un turno', async () => {
      const queueId = 'queue-456';
      const mockLogs = [
        { id: 'log-1', queueId, messageType: MessageType.CONFIRMATION },
        { id: 'log-2', queueId, messageType: MessageType.APPROACHING },
      ];

      mockRepository.find.mockResolvedValue(mockLogs);

      const result = await service.getLogsForQueueItem(queueId);

      expect(result).toHaveLength(2);
      expect(mockRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { queueId } }),
      );
    });
  });

  describe('countFailedMessages', () => {
    it('Debe contar mensajes PENDING y FAILED', async () => {
      const businessId = 'biz-123';
      mockRepository.count.mockResolvedValue(5);

      const result = await service.countFailedMessages(businessId);

      expect(result).toBe(5);
      expect(mockRepository.count).toHaveBeenCalled();
    });
  });
});
