import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './schemas/user.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RegisterDto } from '../auth/dtos/register.dto';
import { LoginDto } from '../auth/dtos/login.dto';
import { Role } from '../role/schema/roles.entity';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('admin')
  async findAll(@Query('tenantId') tenantId: string): Promise<User[]> {
    if (!tenantId) {
      throw new HttpException('Tenant ID is required', HttpStatus.BAD_REQUEST);
    }
    return this.usersService.findAll(tenantId);
  }

  @Get('doctors')
  @Roles('admin', 'patient')
  async findDoctors(
    @Query('tenantId') tenantId: string,
  ): Promise<User[]> {
    if (!tenantId) {
      throw new HttpException('Tenant ID is required', HttpStatus.BAD_REQUEST);
    }
    return this.usersService.findDoctors(tenantId);
  }

  @Get('patients')
  @Roles('admin', 'doctor')
  async findPatients(@Query('tenantId') tenantId: string): Promise<User[]> {
    if (!tenantId) {
      throw new HttpException('Tenant ID is required', HttpStatus.BAD_REQUEST);
    }
    return this.usersService.findPatients(tenantId);
  }

  @Post('create')
  @Roles('admin')
  async createUser(@Body() registerDto: RegisterDto): Promise<User> {
    return this.usersService.createUser(registerDto);
  }

  @Post('login')
  async validateUser(@Body() loginDto: LoginDto): Promise<User | null> {
    const user = await this.usersService.validateUser(loginDto);
    if (!user) {
      throw new HttpException(
        'Invalid email or password',
        HttpStatus.UNAUTHORIZED,
      );
    }
    return user;
  }

  // This endpoint should be used for testing and should be removed or replaced in production
  @Get('test')
  async testEndpoint() {
    // Simulate a failure or success scenario
    const randomNumber = Math.random(); // Generate a random number between 0 and 1
    if (randomNumber < 0.5) {
      // Simulate a failure scenario
      throw new HttpException(
        'Operation failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } else {
      // Simulate a successful scenario
      return { success: true, message: 'Operation succeeded' };
    }
  }
}
