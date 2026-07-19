import { Test, TestingModule } from '@nestjs/testing';
import { QueueController } from './queue.controller';
import { QueueService } from './queue.service';
import { CreateQueueDto, UpdateQueueDto, QueueStatus } from './queue.dto';
import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard';

const BUSINESS_ID = 'biz-uuid-1234';

describe('QueueController', () => {
  let controller: QueueController;
  let service: QueueService;

  const mockQueueResult = {
    queue: [
      {
        id: '1',
        clientName: 'Juan Perez',
        phoneNumber: '+573001234567',
        position: 1,
        status: 'in-progress',
        estimatedTimeMinutes: 15,
        priority: false,
        createdAt: new Date(),
        queueDate: new Date(),
      },
    ],
    total: 1,
    currentPosition: 1,
    message: 'OK',
  };

  const mockService = {
    getQueue: jest.fn().mockResolvedValue(mockQueueResult),
    getQueueByDate: jest.fn().mockResolvedValue(mockQueueResult),
    addToQueue: jest.fn().mockResolvedValue({ success: true, data: {}, totalInQueue: 1 }),
    updateQueueItem: jest.fn().mockResolvedValue({ success: true, message: 'Updated' }),
    removeFromQueue: jest.fn().mockResolvedValue({ success: true, message: 'Removed' }),
    nextInQueue: jest.fn().mockResolvedValue({ success: true, message: 'Next' }),
    completeQueueItem: jest.fn().mockResolvedValue({ success: true, message: 'Completed' }),
    skipQueueItem: jest.fn().mockResolvedValue({ success: true, message: 'Skipped' }),
    pauseQueue: jest.fn().mockResolvedValue({ success: true, queuePaused: true }),
    resumeQueue: jest.fn().mockResolvedValue({ success: true, queuePaused: false }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QueueController],
      providers: [{ provide: QueueService, useValue: mockService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<QueueController>(QueueController);
    service = module.get<QueueService>(QueueService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getQueue', () => {
    it('should call service.getQueue with businessId and return its result', async () => {
      const result = await controller.getQueue(BUSINESS_ID);

      expect(service.getQueue).toHaveBeenCalledWith(BUSINESS_ID);
      expect(result).toEqual(mockQueueResult);
    });
  });

  describe('getQueueByDate', () => {
    it('should call service.getQueueByDate with businessId and date', async () => {
      const result = await controller.getQueueByDate(BUSINESS_ID, '2026-04-18');

      expect(service.getQueueByDate).toHaveBeenCalledWith(BUSINESS_ID, '2026-04-18');
      expect(result).toEqual(mockQueueResult);
    });
  });

  describe('addToQueue', () => {
    it('should call service.addToQueue with businessId and the provided DTO', async () => {
      const dto: CreateQueueDto = { clientName: 'Test', phoneNumber: '+573001111111' };

      await controller.addToQueue(BUSINESS_ID, dto);

      expect(service.addToQueue).toHaveBeenCalledWith(BUSINESS_ID, dto);
    });
  });

  describe('updateQueueItem', () => {
    it('should call service.updateQueueItem with businessId, id and DTO', async () => {
      const dto: UpdateQueueDto = { status: QueueStatus.COMPLETED };

      await controller.updateQueueItem(BUSINESS_ID, '1', dto);

      expect(service.updateQueueItem).toHaveBeenCalledWith(BUSINESS_ID, '1', dto);
    });
  });

  describe('removeFromQueue', () => {
    it('should call service.removeFromQueue with businessId and id', async () => {
      await controller.removeFromQueue(BUSINESS_ID, '42');

      expect(service.removeFromQueue).toHaveBeenCalledWith(BUSINESS_ID, '42');
    });
  });

  describe('nextInQueue', () => {
    it('should call service.nextInQueue with businessId', async () => {
      await controller.nextInQueue(BUSINESS_ID);

      expect(service.nextInQueue).toHaveBeenCalledWith(BUSINESS_ID);
    });
  });

  describe('completeQueueItem', () => {
    it('should call service.completeQueueItem with businessId and id', async () => {
      await controller.completeQueueItem(BUSINESS_ID, '5');

      expect(service.completeQueueItem).toHaveBeenCalledWith(BUSINESS_ID, '5');
    });
  });

  describe('skipQueueItem', () => {
    it('should call service.skipQueueItem with businessId and id', async () => {
      await controller.skipQueueItem(BUSINESS_ID, '7');

      expect(service.skipQueueItem).toHaveBeenCalledWith(BUSINESS_ID, '7');
    });
  });

  describe('pauseQueue', () => {
    it('should call service.pauseQueue with businessId', async () => {
      await controller.pauseQueue(BUSINESS_ID);

      expect(service.pauseQueue).toHaveBeenCalledWith(BUSINESS_ID);
    });
  });

  describe('resumeQueue', () => {
    it('should call service.resumeQueue with businessId', async () => {
      await controller.resumeQueue(BUSINESS_ID);

      expect(service.resumeQueue).toHaveBeenCalledWith(BUSINESS_ID);
    });
  });
});
