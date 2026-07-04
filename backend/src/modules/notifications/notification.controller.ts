import { Controller, Post, Body } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { QueueUpdateNotificationDto, SendNotificationDto } from './notification.dto';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('send')
  async sendNotification(@Body() sendNotificationDto: SendNotificationDto) {
    return this.notificationService.sendNotification(sendNotificationDto);
  }

  @Post('queue-update')
  async notifyQueueUpdate(@Body() data: QueueUpdateNotificationDto) {
    return this.notificationService.notifyQueueUpdate(data);
  }
}
