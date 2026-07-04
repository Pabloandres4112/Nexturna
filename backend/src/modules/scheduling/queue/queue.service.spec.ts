import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { QueueService } from './queue.service';
import { QueueEntity, QueueStatus as EntityQueueStatus } from './queue.entity';
import { UserEntity } from '../users/user.entity';
import { CreateQueueDto, UpdateQueueDto, QueueStatus } from './queue.dto';

const BUSINESS_ID = 'biz-uuid-1234';

function makeQueryBuilder(overrides: Record<string, jest.Mock> = {}) {
  const builder: Record<string, jest.Mock> = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
    getOne: jest.fn().mockResolvedValue(null),
    getCount: jest.fn().mockResolvedValue(0),
    ...overrides,
  };
  return builder;
}

describe('QueueService', () => {
  let service: QueueService;
  let builder: ReturnType<typeof makeQueryBuilder>;

  const mockQueueRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockUserRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    builder = makeQueryBuilder();
    mockQueueRepo.createQueryBuilder.mockReturnValue(builder);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueService,
        { provide: getRepositoryToken(QueueEntity), useValue: mockQueueRepo },
        { provide: getRepositoryToken(UserEntity), useValue: mockUserRepo },
      ],
    }).compile();

    service = module.get<QueueService>(QueueService);

    mockUserRepo.findOne.mockResolvedValue({
      id: BUSINESS_ID,
      settings: {
        averageServiceTime: 20,
        automationEnabled: false,
        excludedContacts: [],
        maxDaysAhead: 2,
        queuePaused: false,
      },
    });

    mockQueueRepo.create.mockImplementation((data: Partial<QueueEntity>) => data);
    mockQueueRepo.save.mockImplementation((data: any) => Promise.resolve(data));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getQueueByDate', () => {
    it('should return queue data with correct shape', async () => {
      builder.getMany.mockResolvedValue([]);

      const result = await service.getQueueByDate(BUSINESS_ID, '2026-04-18');

      expect(result).toHaveProperty('queue');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('currentPosition');
    });

    it('should throw on invalid date', async () => {
      await expect(service.getQueueByDate(BUSINESS_ID, 'not-a-date')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('addToQueue', () => {
    it('should reject when queue is paused', async () => {
      mockUserRepo.findOne.mockResolvedValue({
        id: BUSINESS_ID,
        settings: {
          averageServiceTime: 20,
          automationEnabled: false,
          excludedContacts: [],
          maxDaysAhead: 2,
          queuePaused: true,
        },
      });

      await expect(
        service.addToQueue(BUSINESS_ID, { clientName: 'A', phoneNumber: '+1234' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject duplicated phoneNumber in same day', async () => {
      builder.getCount.mockResolvedValueOnce(1);

      await expect(
        service.addToQueue(BUSINESS_ID, { clientName: 'A', phoneNumber: '+1234' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should reject creation beyond maxDaysAhead', async () => {
      await expect(
        service.addToQueue(BUSINESS_ID, {
          clientName: 'A',
          phoneNumber: '+1234',
          queueDate: '2099-01-01',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create a queue item with priority and return success', async () => {
      const dto: CreateQueueDto = {
        clientName: 'Prioritario',
        phoneNumber: '+573001111111',
        priority: true,
      };

      builder.getCount.mockResolvedValueOnce(0).mockResolvedValue(1);
      builder.getOne.mockResolvedValue(null);
      mockQueueRepo.findOne.mockResolvedValue({ id: 'new-uuid', ...dto, position: 1 });

      const result = await service.addToQueue(BUSINESS_ID, dto);

      expect(result.success).toBe(true);
      expect(result.totalInQueue).toBe(1);
    });
  });

  describe('updateQueueItem', () => {
    it('should update status and return success', async () => {
      const item = {
        id: '1',
        businessId: BUSINESS_ID,
        status: EntityQueueStatus.WAITING,
        position: 1,
        queueDate: new Date('2026-04-18'),
      };
      mockQueueRepo.findOne.mockResolvedValue(item);

      const dto: UpdateQueueDto = { status: QueueStatus.COMPLETED };
      const result = await service.updateQueueItem(BUSINESS_ID, '1', dto);

      expect(result.success).toBe(true);
    });

    it('should throw NotFoundException when item not found', async () => {
      mockQueueRepo.findOne.mockResolvedValue(null);

      await expect(service.updateQueueItem(BUSINESS_ID, '404', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('skipQueueItem', () => {
    it('should mark item as no-show', async () => {
      const item = {
        id: '7',
        businessId: BUSINESS_ID,
        status: EntityQueueStatus.WAITING,
        position: 2,
        queueDate: new Date('2026-04-18'),
      };
      mockQueueRepo.findOne.mockResolvedValue(item);

      const result = await service.skipQueueItem(BUSINESS_ID, '7');

      expect(result.success).toBe(true);
      expect(result.data.status).toBe(EntityQueueStatus.NO_SHOW);
    });
  });

  describe('pause/resume queue', () => {
    it('should pause queue', async () => {
      const business = {
        id: BUSINESS_ID,
        settings: {
          averageServiceTime: 20,
          automationEnabled: false,
          excludedContacts: [],
          maxDaysAhead: 2,
          queuePaused: false,
        },
      };
      mockUserRepo.findOne.mockResolvedValue(business);

      const result = await service.pauseQueue(BUSINESS_ID);

      expect(result.success).toBe(true);
      expect(result.queuePaused).toBe(true);
      expect(mockUserRepo.save).toHaveBeenCalled();
    });

    it('should resume queue', async () => {
      const business = {
        id: BUSINESS_ID,
        settings: {
          averageServiceTime: 20,
          automationEnabled: false,
          excludedContacts: [],
          maxDaysAhead: 2,
          queuePaused: true,
        },
      };
      mockUserRepo.findOne.mockResolvedValue(business);

      const result = await service.resumeQueue(BUSINESS_ID);

      expect(result.success).toBe(true);
      expect(result.queuePaused).toBe(false);
      expect(mockUserRepo.save).toHaveBeenCalled();
    });
  });
});
