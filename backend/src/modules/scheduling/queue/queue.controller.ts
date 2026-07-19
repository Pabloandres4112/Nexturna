import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  ParseUUIDPipe,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { QueueService } from './queue.service';
import {
  CreateQueueDto,
  GetQueueHistoryResponse,
  GetQueueResponse,
  UpdateQueueDto,
} from './queue.dto';
import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard';
import { CurrentBusinessId } from '@shared/decorators/current-business-id.decorator';

@UseGuards(JwtAuthGuard)
@Controller('queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Get()
  async getQueue(@CurrentBusinessId() businessId: string): Promise<GetQueueResponse> {
    return this.queueService.getQueue(businessId);
  }

  @Get('history')
  async getQueueHistory(
    @CurrentBusinessId() businessId: string,
    @Query('date') date?: string,
  ): Promise<GetQueueHistoryResponse> {
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException('Fecha inválida. Usa formato YYYY-MM-DD');
    }
    return this.queueService.getQueueHistory(businessId, date);
  }

  @Get(':date')
  async getQueueByDate(
    @CurrentBusinessId() businessId: string,
    @Param('date') date: string,
  ): Promise<GetQueueResponse> {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException('Fecha inválida. Usa formato YYYY-MM-DD');
    }
    return this.queueService.getQueueByDate(businessId, date);
  }

  @Post()
  async addToQueue(
    @CurrentBusinessId() businessId: string,
    @Body() createQueueDto: CreateQueueDto,
  ) {
    return this.queueService.addToQueue(businessId, createQueueDto);
  }

  @Put(':id')
  async updateQueueItem(
    @CurrentBusinessId() businessId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateQueueDto: UpdateQueueDto,
  ) {
    return this.queueService.updateQueueItem(businessId, id, updateQueueDto);
  }

  @Delete(':id')
  async removeFromQueue(
    @CurrentBusinessId() businessId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.queueService.removeFromQueue(businessId, id);
  }

  @Post('next')
  async nextInQueue(@CurrentBusinessId() businessId: string) {
    return this.queueService.nextInQueue(businessId);
  }

  @Post('complete/:id')
  async completeQueueItem(
    @CurrentBusinessId() businessId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.queueService.completeQueueItem(businessId, id);
  }

  @Post('skip/:id')
  async skipQueueItem(
    @CurrentBusinessId() businessId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.queueService.skipQueueItem(businessId, id);
  }

  @Post('pause')
  async pauseQueue(@CurrentBusinessId() businessId: string) {
    return this.queueService.pauseQueue(businessId);
  }

  @Post('resume')
  async resumeQueue(@CurrentBusinessId() businessId: string) {
    return this.queueService.resumeQueue(businessId);
  }
}
