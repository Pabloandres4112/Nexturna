import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto, UpdateUserDto } from './user.dto';
import { User, CreateUserResponse, UpdateUserResponse, UserSettings } from './user.types';
import { UserEntity } from './user.entity';
import { UserRole } from './user-role.enum';
import { defaultUserSettings, normalizeUserSettings } from './user-settings.util';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async getAllUsers(): Promise<User[]> {
    const users = await this.userRepository.find({
      order: { createdAt: 'DESC' },
    });

    return users.map((user) => ({
      id: user.id,
      role: user.role,
      businessName: user.businessName,
      whatsappNumber: user.whatsappNumber,
      settings: normalizeUserSettings(user.settings),
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
      settings: normalizeUserSettings(user.settings),
    };
  }

  async createUser(createUserDto: CreateUserDto): Promise<CreateUserResponse> {
    const user = this.userRepository.create({
      role: UserRole.BUSINESS_OWNER,
      businessName: createUserDto.businessName,
      whatsappNumber: createUserDto.whatsappNumber,
      email: createUserDto.email ?? null,
      settings: defaultUserSettings(),
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
      this.logger.warn(`Intento de actualizar usuario inexistente: ${id}`);
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
        ...normalizeUserSettings(user.settings),
        ...updateUserDto.settings,
      };
      user.settings = normalizeUserSettings(user.settings);
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

    return normalizeUserSettings(user.settings);
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

    const normalizedSettings = normalizeUserSettings(user.settings);
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

    const normalizedSettings = normalizeUserSettings(user.settings);
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
      excludedContacts: normalizeUserSettings(user.settings).excludedContacts,
    };
  }
}
