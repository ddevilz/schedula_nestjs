import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  HttpStatus,
  HttpCode,
  Request,
} from '@nestjs/common';
import { PatientService } from './patient.service';
import { PatientDto } from './dto/patient.dto';
import { Patient } from './schema/patient.entity';
import { Request as ExRequest } from 'express';

@Controller('patients')
export class PatientController {
  constructor(private readonly patientsService: PatientService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createPatient(
    @Body() patientDto: PatientDto,
    @Request() req: ExRequest,
  ): Promise<Patient> {
    const userId = req.user?.userId;
    return this.patientsService.createPatient(patientDto, userId);
  }

  @Get()
  async findAllPatients(): Promise<Patient[]> {
    return this.patientsService.findAllPatients();
  }

  @Get(':id')
  async findPatientById(@Param('id') id: string): Promise<Patient> {
    return this.patientsService.findPatientById(id);
  }

  @Patch(':id')
  async updatePatient(
    @Param('id') id: string,
    @Body() patientDto: PatientDto,
  ): Promise<Patient> {
    return this.patientsService.updatePatient(id, patientDto);
  }

  @Delete(':id')
  async deletePatient(@Param('id') id: string): Promise<void> {
    return this.patientsService.deletePatient(id);
  }
}
