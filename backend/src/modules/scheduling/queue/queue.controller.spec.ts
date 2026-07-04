import { Test, TestingModule } from '@nestjs/testing';
import { QueueController } from './queue.controller';
import { QueueService } from './queue.service';
import { CreateQueueDto, UpdateQueueDto, QueueStatus } from './queue.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

const BUSINESS_ID = 'biz-uuid-1234';
const mockReq = { user: { id: BUSINESS_ID } } as any;

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
      const result = await controller.getQueue(mockReq);

      expect(service.getQueue).toHaveBeenCalledWith(BUSINESS_ID);
      expect(result).toEqual(mockQueueResult);
    });
  });

  describe('getQueueByDate', () => {
    it('should call service.getQueueByDate with businessId and date', async () => {
      const result = await controller.getQueueByDate(mockReq, '2026-04-18');

      expect(service.getQueueByDate).toHaveBeenCalledWith(BUSINESS_ID, '2026-04-18');
      expect(result).toEqual(mockQueueResult);
    });
  });

  describe('addToQueue', () => {
    it('should call service.addToQueue with businessId and the provided DTO', async () => {
      const dto: CreateQueueDto = { clientName: 'Test', phoneNumber: '+573001111111' };

      await controller.addToQueue(mockReq, dto);

      expect(service.addToQueue).toHaveBeenCalledWith(BUSINESS_ID, dto);
    });
  });

  describe('updateQueueItem', () => {
    it('should call service.updateQueueItem with businessId, id and DTO', async () => {
      const dto: UpdateQueueDto = { status: QueueStatus.COMPLETED };

      await controller.updateQueueItem(mockReq, '1', dto);

      expect(service.updateQueueItem).toHaveBeenCalledWith(BUSINESS_ID, '1', dto);
    });
  });

  describe('removeFromQueue', () => {
    it('should call service.removeFromQueue with businessId and id', async () => {
      await controller.removeFromQueue(mockReq, '42');

      expect(service.removeFromQueue).toHaveBeenCalledWith(BUSINESS_ID, '42');
    });
  });

  describe('nextInQueue', () => {
    it('should call service.nextInQueue with businessId', async () => {
      await controller.nextInQueue(mockReq);

      expect(service.nextInQueue).toHaveBeenCalledWith(BUSINESS_ID);
    });
  });

  describe('completeQueueItem', () => {
    it('should call service.completeQueueItem with businessId and id', async () => {
      await controller.completeQueueItem(mockReq, '5');

      expect(service.completeQueueItem).toHaveBeenCalledWith(BUSINESS_ID, '5');
    });
  });

  describe('skipQueueItem', () => {
    it('should call service.skipQueueItem with businessId and id', async () => {
      await controller.skipQueueItem(mockReq, '7');

      expect(service.skipQueueItem).toHaveBeenCalledWith(BUSINESS_ID, '7');
    });
  });

  describe('pauseQueue', () => {
    it('should call service.pauseQueue with businessId', async () => {
      await controller.pauseQueue(mockReq);

      expect(service.pauseQueue).toHaveBeenCalledWith(BUSINESS_ID);
    });
  });

  describe('resumeQueue', () => {
    it('should call service.resumeQueue with businessId', async () => {
      await controller.resumeQueue(mockReq);

      expect(service.resumeQueue).toHaveBeenCalledWith(BUSINESS_ID);
    });
  });
});
