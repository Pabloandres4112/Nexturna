import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { UserService } from './user.service';
import {
  CreateUserDto,
  UpdateUserDto,
  AddExcludedContactDto,
  ExcludedContactsResponseDto,
} from './user.dto';
import { User, CreateUserResponse, UpdateUserResponse, UserSettings } from './user.types';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from './user-role.enum';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':id/settings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.BUSINESS_OWNER, UserRole.BUSINESS_STAFF)
  async getUserSettings(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<UserSettings> {
    return this.userService.getUserSettings(id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.BUSINESS_OWNER, UserRole.BUSINESS_STAFF)
  async getUser(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string): Promise<User> {
    return this.userService.getUser(id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN)
  async getAllUsers(): Promise<User[]> {
    return this.userService.getAllUsers();
  }

  @Post()
  async createUser(@Body() createUserDto: CreateUserDto): Promise<CreateUserResponse> {
    return this.userService.createUser(createUserDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.BUSINESS_OWNER, UserRole.BUSINESS_STAFF)
  async updateUser(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UpdateUserResponse> {
    return this.userService.updateUser(id, updateUserDto);
  }

  @Get(':id/excluded-contacts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.BUSINESS_OWNER, UserRole.BUSINESS_STAFF)
  async getExcludedContacts(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<{ success: boolean; excludedContacts: string[] }> {
    return this.userService.getExcludedContacts(id);
  }

  @Post(':id/excluded-contacts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.BUSINESS_OWNER, UserRole.BUSINESS_STAFF)
  async addExcludedContact(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: AddExcludedContactDto,
  ): Promise<ExcludedContactsResponseDto> {
    return this.userService.addExcludedContact(id, dto.phoneNumber);
  }

  @Delete(':id/excluded-contacts/:phoneNumber')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.BUSINESS_OWNER, UserRole.BUSINESS_STAFF)
  async removeExcludedContact(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('phoneNumber') phoneNumber: string,
  ): Promise<ExcludedContactsResponseDto> {
    return this.userService.removeExcludedContact(id, phoneNumber);
  }
}
