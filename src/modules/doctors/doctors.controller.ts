import {
  Controller,
  Post,
  Body,
  Param,
  Patch,
  HttpStatus,
  HttpCode,
  Request,
  Get,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ValidationPipe,
} from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { DoctorBasicInfoDto } from './dto/doctor-basic-info.dto';
import { DoctorAvailabilityDto } from './dto/doctor-availability.dto';
import { DoctorSpecializationDto } from './dto/doctor-specialization.dto';
import { Request as ExRequest } from 'express';
import { Roles } from '../auth/roles.decorator';
import { Doctor } from './schemas/doctors.entity';

@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorService: DoctorsService) {}

  @Get()
  @Roles('admin', 'Patient')
  async getAllDoctors() {
    try {
      return await this.doctorService.findAllDoctors();
    } catch (error) {
      throw new BadRequestException('Failed to retrieve doctors');
    }
  }

  @Get(':id')
  async findDoctorById(@Param('id') id: string): Promise<Doctor> {
    try {
      const doctor = await this.doctorService.findDoctorById(id);
      if (!doctor) {
        throw new NotFoundException(`Doctor with ID ${id} not found`);
      }
      return doctor;
    } catch (error) {
      throw new NotFoundException(`Doctor with ID ${id} not found`);
    }
  }

  @Post('onboard/step1')
  @Roles('Doctor')
  @HttpCode(HttpStatus.CREATED)
  async onboardStep1(
    @Body(ValidationPipe) basicInfoDto: DoctorBasicInfoDto,
    @Request() req: ExRequest,
  ) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new BadRequestException('User ID not found in request');
      }
      return await this.doctorService.onboardStep1(basicInfoDto, userId);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Failed to onboard doctor in step 1');
    }
  }

  @Patch('onboard/step2/:id')
  @Roles('Doctor')
  async onboardStep2(
    @Param('id') id: string,
    @Body() availabilityDto: DoctorAvailabilityDto,
  ) {
    try {
      return await this.doctorService.onboardStep2(id, availabilityDto);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to onboard doctor in step 2');
    }
  }

  @Patch('onboard/step3/:id')
  @Roles('Doctor')
  async onboardStep3(
    @Param('id') id: string,
    @Body(ValidationPipe) specializationDto: DoctorSpecializationDto,
  ) {
    try {
      return await this.doctorService.onboardStep3(id, specializationDto);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to onboard doctor in step 3');
    }
  }
}
