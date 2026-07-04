import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Body,
  Query,
  UnauthorizedException,
  UseGuards,
  Request,
} from '@nestjs/common';
import { MessageLogService } from './message-log.service';
import {
  CreateMessageLogDto,
  UpdateMessageLogDto,
  MessageLogResponseDto,
  GetMessageLogsQueryDto,
} from './message-log.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '../users/user-role.enum';

@Controller('message-logs')
export class MessageLogController {
  constructor(private readonly messageLogService: MessageLogService) {}

  private getBusinessId(req: any): string {
    const businessId = req.user?.businessId ?? req.user?.id;
    if (!businessId) {
      throw new UnauthorizedException('No se pudo identificar el negocio en el token');
    }
    return businessId;
  }

  /**
   * GET /message-logs?phoneNumber=...&status=...&limit=50
   * Obtiene historial de mensajes con filtros opcionales.
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BUSINESS_OWNER, UserRole.BUSINESS_STAFF, UserRole.PLATFORM_ADMIN)
  async getLogs(
    @Request() req: any,
    @Query() query: GetMessageLogsQueryDto,
  ): Promise<{ logs: MessageLogResponseDto[]; total: number }> {
    const businessId = this.getBusinessId(req);
    return this.messageLogService.getLogsForBusiness(businessId, query);
  }

  /**
   * GET /message-logs/:id
   * Obtiene un mensaje log específico.
   */
  @Get('phone/:phoneNumber')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.BUSINESS_OWNER, UserRole.BUSINESS_STAFF)
  async getLogsForPhone(
    @Request() req: any,
    @Param('phoneNumber') phoneNumber: string,
  ): Promise<MessageLogResponseDto[]> {
    const businessId = this.getBusinessId(req);
    return this.messageLogService.getLogsForPhoneNumber(businessId, phoneNumber);
  }

  /**
   * GET /message-logs/queue/:queueId
   * Obtiene todos los mensajes relacionados a un turno.
   */
  @Get('queue/:queueId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BUSINESS_OWNER, UserRole.BUSINESS_STAFF, UserRole.PLATFORM_ADMIN)
  async getLogsForQueue(
    @Param('queueId', new ParseUUIDPipe({ version: '4' })) queueId: string,
  ): Promise<MessageLogResponseDto[]> {
    return this.messageLogService.getLogsForQueueItem(queueId);
  }

  /**
   * GET /message-logs/:id
   * Obtiene un mensaje log específico.
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BUSINESS_OWNER, UserRole.BUSINESS_STAFF, UserRole.PLATFORM_ADMIN)
  async getLogById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<MessageLogResponseDto> {
    return this.messageLogService.getLogById(id);
  }

  /**
   * POST /message-logs
   * Crea un nuevo registro de mensaje (llamado automáticamente por WhatsApp service).
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.BUSINESS_OWNER, UserRole.BUSINESS_STAFF)
  async createLog(
    @Request() req: any,
    @Body() dto: CreateMessageLogDto,
  ): Promise<MessageLogResponseDto> {
    const businessId = this.getBusinessId(req);
    const userId = req.user?.id;

    if (!userId) {
      throw new UnauthorizedException('No se pudo identificar el usuario en el token');
    }

    return this.messageLogService.createLog(businessId, userId, dto);
  }

  /**
   * PUT /message-logs/:id
   * Actualiza el estado de un mensaje (para marcar como entregado, fallido, etc).
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BUSINESS_OWNER, UserRole.BUSINESS_STAFF, UserRole.PLATFORM_ADMIN)
  async updateLog(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateMessageLogDto,
  ): Promise<MessageLogResponseDto> {
    return this.messageLogService.updateLog(id, dto);
  }

  /**
   * GET /message-logs/health/failed-count
   * Obtiene conteo de mensajes fallidos para monitoring.
   */
  @Get('health/failed-count')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.BUSINESS_OWNER)
  async getFailedCount(@Request() req: any): Promise<{ failedCount: number }> {
    const businessId = this.getBusinessId(req);
    const failedCount = await this.messageLogService.countFailedMessages(businessId);
    return { failedCount };
  }
}
