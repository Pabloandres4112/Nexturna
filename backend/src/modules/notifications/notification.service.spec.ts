import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notif.service';
import { SendNotificationDto, NotificationType } from './notif.dto';

describe('NotificationService', () => {
  let service: NotificationService;

  const mockDto: SendNotificationDto = {
    userId: '550e8400-e29b-41d4-a716-446655440000',
    title: 'Tu turno',
    body: 'Tu turno está próximo',
    type: NotificationType.NEXT_TURN,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationService],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
  });

  describe('sendNotification', () => {
    it('should return success true', async () => {
      const result = await service.sendNotification(mockDto);

      expect(result.success).toBe(true);
    });

    it('should return a message string', async () => {
      const result = await service.sendNotification(mockDto);

      expect(typeof result.message).toBe('string');
      expect(result.message.length).toBeGreaterThan(0);
    });
  });

  describe('notifyQueueUpdate', () => {
    it('should return success true when notifying a queue update', async () => {
      const data = { queueId: 'q1', action: 'next' };
      const result = await service.notifyQueueUpdate(data);

      expect(result.success).toBe(true);
    });

    it('should return a message string', async () => {
      const result = await service.notifyQueueUpdate({});

      expect(typeof result.message).toBe('string');
    });
  });
});
