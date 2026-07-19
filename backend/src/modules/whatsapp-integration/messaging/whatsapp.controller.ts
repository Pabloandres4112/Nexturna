import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';
import { SendTestMessageDto, SendTestMessageResponseDto } from './whatsapp.dto';
import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard';

/**
 * Endpoint manual para probar el envio de WhatsApp end-to-end (credenciales,
 * numero de telefono, conectividad con Graph API) sin depender de un evento
 * de negocio real. No es parte del flujo automatico de turnos todavia
 * (eso es la Fase 3 del roadmap: motor de automation_rules).
 */
@Controller('whatsapp')
@UseGuards(JwtAuthGuard)
export class WhatsAppController {
  constructor(private readonly whatsAppService: WhatsAppService) {}

  @Post('test-send')
  async sendTestMessage(@Body() dto: SendTestMessageDto): Promise<SendTestMessageResponseDto> {
    return this.whatsAppService.sendMessage(dto.phoneNumber, dto.message);
  }
}
