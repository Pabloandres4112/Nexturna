import { Body, Controller, Get, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthenticatedUser, LoginDto, RegisterDto } from './auth.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

interface RequestWithUser {
  user: AuthenticatedUser;
}

interface RegisterRequest extends RequestWithUser {
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
  socket?: { remoteAddress?: string };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() req: RequestWithUser) {
    return req.user;
  }

  @Post('register')
  async register(@Body() dto: RegisterDto, @Req() req: RegisterRequest) {
    const userAgent = Array.isArray(req.headers['user-agent'])
      ? req.headers['user-agent'][0]
      : req.headers['user-agent'];

    const appVersion = Array.isArray(req.headers['x-app-version'])
      ? req.headers['x-app-version'][0]
      : req.headers['x-app-version'];

    const ipAddress = req.ip ?? req.socket?.remoteAddress ?? null;

    return this.authService.register(dto, {
      ipAddress,
      userAgent: userAgent ?? null,
      appVersion: appVersion ?? null,
    });
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me/consents')
  @UseGuards(JwtAuthGuard)
  async getMyLegalConsents(@Req() req: RequestWithUser) {
    return this.authService.getLegalConsentsByUserId(req.user.id);
  }
}
