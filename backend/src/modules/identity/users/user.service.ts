import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto, UpdateUserDto } from './user.dto';
import { User, CreateUserResponse, UpdateUserResponse, UserSettings } from './user.types';
import { UserEntity } from './user.entity';
import { UserRole } from './user-role.enum';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
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

  async getAllUsers(): Promise<User[]> {
    const users = await this.userRepository.find({
      order: { createdAt: 'DESC' },
    });

    return users.map((user) => ({
      id: user.id,
      role: user.role,
      businessName: user.businessName,
      whatsappNumber: user.whatsappNumber,
      settings: this.normalizeSettings(user.settings),
    }));
  }

  async getUser(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    }

    return {
      id: user.id,
      role: user.role,
      businessName: user.businessName,
      whatsappNumber: user.whatsappNumber,
      settings: this.normalizeSettings(user.settings),
    };
  }

  async createUser(createUserDto: CreateUserDto): Promise<CreateUserResponse> {
    const user = this.userRepository.create({
      role: UserRole.BUSINESS_OWNER,
      businessName: createUserDto.businessName,
      whatsappNumber: createUserDto.whatsappNumber,
      email: createUserDto.email ?? null,
      settings: this.defaultSettings(),
    });

    const savedUser = await this.userRepository.save(user);

    return {
      success: true,
      message: 'Usuario creado',
      userId: savedUser.id,
    };
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<UpdateUserResponse> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    }

    if (updateUserDto.businessName !== undefined) {
      user.businessName = updateUserDto.businessName;
    }

    if (updateUserDto.email !== undefined) {
      user.email = updateUserDto.email;
    }

    if (updateUserDto.settings !== undefined) {
      user.settings = {
        ...this.normalizeSettings(user.settings),
        ...updateUserDto.settings,
      };
      user.settings = this.normalizeSettings(user.settings);
    }

    await this.userRepository.save(user);

    return {
      success: true,
      message: 'Usuario actualizado',
    };
  }

  async getUserSettings(id: string): Promise<UserSettings> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    }

    return this.normalizeSettings(user.settings);
  }

  /**
   * Agrega un número telefónico a la lista de contactos excluidos.
   * Los contactos excluidos NO reciben mensajes automatizados.
   */
  async addExcludedContact(userId: string, phoneNumber: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException(`Usuario con id ${userId} no encontrado`);
    }

    const normalizedSettings = this.normalizeSettings(user.settings);
    const currentExcluded = normalizedSettings.excludedContacts;

    // Verificar si ya está en la lista
    if (currentExcluded.includes(phoneNumber)) {
      return {
        success: false,
        message: 'Este contacto ya está en la lista de exclusión',
        excludedContacts: currentExcluded,
      };
    }

    // Agregar a la lista
    user.settings = {
      ...normalizedSettings,
      excludedContacts: [...currentExcluded, phoneNumber],
    };

    await this.userRepository.save(user);

    return {
      success: true,
      message: 'Contacto agregado a exclusión',
      excludedContacts: user.settings.excludedContacts,
    };
  }

  /**
   * Remueve un número telefónico de la lista de contactos excluidos.
   */
  async removeExcludedContact(userId: string, phoneNumber: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException(`Usuario con id ${userId} no encontrado`);
    }

    const normalizedSettings = this.normalizeSettings(user.settings);
    const currentExcluded = normalizedSettings.excludedContacts;

    // Verificar si existe en la lista
    if (!currentExcluded.includes(phoneNumber)) {
      return {
        success: false,
        message: 'Este contacto no está en la lista de exclusión',
        excludedContacts: currentExcluded,
      };
    }

    // Remover de la lista
    user.settings = {
      ...normalizedSettings,
      excludedContacts: currentExcluded.filter((c) => c !== phoneNumber),
    };

    await this.userRepository.save(user);

    return {
      success: true,
      message: 'Contacto removido de exclusión',
      excludedContacts: user.settings.excludedContacts,
    };
  }

  /**
   * Obtiene la lista completa de contactos excluidos para un usuario.
   */
  async getExcludedContacts(userId: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException(`Usuario con id ${userId} no encontrado`);
    }

    return {
      success: true,
      excludedContacts: this.normalizeSettings(user.settings).excludedContacts,
    };
  }
}
