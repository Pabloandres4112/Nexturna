import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserEntity } from '../users/user.entity';
import { LoginDto, RegisterDto } from './auth.dto';
import { UserRole } from '../users/user-role.enum';
import { LegalConsentEntity } from './legal-consent.entity';
import { UserSettings } from '../users/user.entity';

interface JwtPayload {
  sub: string;
  role: UserRole;
  whatsappNumber: string;
  email: string | null;
  businessName: string;
}

interface LegalEvidenceMetadata {
  ipAddress?: string | null;
  userAgent?: string | null;
  appVersion?: string | null;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(LegalConsentEntity)
    private readonly legalConsentRepository: Repository<LegalConsentEntity>,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  private defaultSettings(): UserSettings {
    return {
      averageServiceTime: 30,
      automationEnabled: true,
      excludedContacts: [],
      maxDaysAhead: 7,
      queuePaused: false,
    };
  }

  private normalizeSettings(settings: UserEntity['settings'] | null | undefined): UserSettings {
    const defaults = this.defaultSettings();

    return {
      averageServiceTime:
        typeof settings?.averageServiceTime === 'number' && settings.averageServiceTime > 0
          ? settings.averageServiceTime
          : defaults.averageServiceTime,
      automationEnabled:
        typeof settings?.automationEnabled === 'boolean'
          ? settings.automationEnabled
          : defaults.automationEnabled,
      excludedContacts: Array.isArray(settings?.excludedContacts)
        ? settings.excludedContacts.filter((value): value is string => typeof value === 'string')
        : defaults.excludedContacts,
      maxDaysAhead:
        typeof settings?.maxDaysAhead === 'number' && settings.maxDaysAhead >= 0
          ? settings.maxDaysAhead
          : defaults.maxDaysAhead,
      queuePaused:
        typeof settings?.queuePaused === 'boolean' ? settings.queuePaused : defaults.queuePaused,
    };
  }

  private async ensureSinglePlatformAdmin(user: UserEntity): Promise<void> {
    if (user.role !== UserRole.PLATFORM_ADMIN) {
      return;
    }

    const totalAdmins = await this.usersRepository.count({
      where: { role: UserRole.PLATFORM_ADMIN },
    });

    if (totalAdmins > 1) {
      throw new ConflictException(
        'Configuración inválida: solo puede existir un usuario platform_admin',
      );
    }
  }

  async register(dto: RegisterDto, metadata?: LegalEvidenceMetadata) {
    const existing = await this.usersRepository.findOne({
      where: dto.email
        ? [{ whatsappNumber: dto.whatsappNumber }, { email: dto.email }]
        : [{ whatsappNumber: dto.whatsappNumber }],
    });

    if (existing) {
      throw new ConflictException('El usuario ya existe');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = this.usersRepository.create({
      role: UserRole.BUSINESS_OWNER,
      businessName: dto.businessName,
      whatsappNumber: dto.whatsappNumber,
      email: dto.email ?? null,
      passwordHash,
      settings: null,
    });

    const saved = await this.usersRepository.save(user);

    const termsVersion =
      dto.termsVersion ?? this.configService.get<string>('LEGAL_TERMS_VERSION') ?? 'v1';
    const privacyPolicyVersion =
      dto.privacyPolicyVersion ??
      this.configService.get<string>('LEGAL_PRIVACY_POLICY_VERSION') ??
      'v1';

    const legalConsent = this.legalConsentRepository.create({
      userId: saved.id,
      acceptedTerms: dto.acceptTerms,
      acceptedPrivacyPolicy: dto.acceptPrivacyPolicy,
      termsVersion,
      privacyPolicyVersion,
      ipAddress: metadata?.ipAddress ?? null,
      userAgent: metadata?.userAgent ?? null,
      appVersion: metadata?.appVersion ?? null,
    });
    await this.legalConsentRepository.save(legalConsent);

    const accessToken = await this.signToken(saved);

    return {
      accessToken,
      user: this.sanitizeUser(saved),
    };
  }

  async getLegalConsentsByUserId(userId: string) {
    return this.legalConsentRepository.find({
      where: { userId },
      order: { acceptedAt: 'DESC' },
    });
  }

  async login(dto: LoginDto) {
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.whatsappNumber = :identifier OR user.email = :identifier', {
        identifier: dto.identifier,
      })
      .getOne();

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException('Este usuario aún no tiene credenciales configuradas');
    }

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    await this.ensureSinglePlatformAdmin(user);

    const accessToken = await this.signToken(user);

    return {
      accessToken,
      user: this.sanitizeUser(user),
    };
  }

  async validateUserById(userId: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('Usuario no válido');
    }

    await this.ensureSinglePlatformAdmin(user);

    return this.sanitizeUser(user);
  }

  private async signToken(user: UserEntity) {
    const payload: JwtPayload = {
      sub: user.id,
      role: user.role,
      whatsappNumber: user.whatsappNumber,
      email: user.email ?? null,
      businessName: user.businessName,
    };

    return this.jwtService.signAsync(payload);
  }

  private sanitizeUser(user: UserEntity) {
    return {
      id: user.id,
      role: user.role,
      businessName: user.businessName,
      whatsappNumber: user.whatsappNumber,
      email: user.email ?? null,
      settings: this.normalizeSettings(user.settings),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
