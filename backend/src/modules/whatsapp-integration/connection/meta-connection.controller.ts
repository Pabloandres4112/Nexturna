import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard';
import { CurrentBusinessId } from '@shared/decorators/current-business-id.decorator';
import { MetaConnectionService } from './meta-connection.service';
import { ConnectMetaDto, MetaConnectionResponseDto } from './meta-connection.dto';

@Controller('meta-connections')
@UseGuards(JwtAuthGuard)
export class MetaConnectionController {
  constructor(private readonly metaConnectionService: MetaConnectionService) {}

  @Get('me')
  async getMyConnection(
    @CurrentBusinessId() businessId: string,
  ): Promise<MetaConnectionResponseDto | null> {
    return this.metaConnectionService.getForBusiness(businessId);
  }

  /**
   * Alta manual (temporal): hasta que el Embedded Signup real este armado
   * del lado mobile, esto permite conectar un numero ya verificado en Meta
   * a mano, sin pasar por el intercambio OAuth.
   */
  @Post()
  async connect(
    @CurrentBusinessId() businessId: string,
    @Body() dto: ConnectMetaDto,
  ): Promise<MetaConnectionResponseDto> {
    return this.metaConnectionService.connectManually(businessId, dto);
  }
}
