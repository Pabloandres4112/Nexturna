import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  ParseUUIDPipe,
  Param,
  UseGuards,
  Req,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { QueueService } from './queue.service';
import { CreateQueueDto, UpdateQueueDto } from './queue.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UserEntity } from '../users/user.entity';

interface AuthRequest extends Request {
  user: UserEntity;
}

@UseGuards(JwtAuthGuard)
@Controller('queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  private getBusinessId(req: AuthRequest): string {
    const businessId = req.user?.id;
    if (!businessId) {
      throw new UnauthorizedException('Usuario no autenticado');
    }
    return businessId;
  }

  @Get()
  async getQueue(@Req() req: AuthRequest): Promise<any> {
    return this.queueService.getQueue(this.getBusinessId(req));
  }

  @Get(':date')
  async getQueueByDate(@Req() req: AuthRequest, @Param('date') date: string): Promise<any> {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException('Fecha inválida. Usa formato YYYY-MM-DD');
    }
    return this.queueService.getQueueByDate(this.getBusinessId(req), date);
  }

  @Post()
  async addToQueue(@Req() req: AuthRequest, @Body() createQueueDto: CreateQueueDto): Promise<any> {
    return this.queueService.addToQueue(this.getBusinessId(req), createQueueDto);
  }

  @Put(':id')
  async updateQueueItem(
    @Req() req: AuthRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateQueueDto: UpdateQueueDto,
  ) {
    return this.queueService.updateQueueItem(this.getBusinessId(req), id, updateQueueDto);
  }

  @Delete(':id')
  async removeFromQueue(
    @Req() req: AuthRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.queueService.removeFromQueue(this.getBusinessId(req), id);
  }

  @Post('next')
  async nextInQueue(@Req() req: AuthRequest) {
    return this.queueService.nextInQueue(this.getBusinessId(req));
  }

  @Post('complete/:id')
  async completeQueueItem(
    @Req() req: AuthRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.queueService.completeQueueItem(this.getBusinessId(req), id);
  }

  @Post('skip/:id')
  async skipQueueItem(
    @Req() req: AuthRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.queueService.skipQueueItem(this.getBusinessId(req), id);
  }

  @Post('pause')
  async pauseQueue(@Req() req: AuthRequest) {
    return this.queueService.pauseQueue(this.getBusinessId(req));
  }

  @Post('resume')
  async resumeQueue(@Req() req: AuthRequest) {
    return this.queueService.resumeQueue(this.getBusinessId(req));
  }
}
