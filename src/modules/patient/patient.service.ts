import {
  ConflictException,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from './schema/patient.entity';
import { PatientDto } from './dto/patient.dto';

@Injectable()
export class PatientService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
  ) {}

  async createPatient(
    patientDto: PatientDto,
    userId: string,
  ): Promise<Patient> {
    try {
      const existingPatient = await this.patientRepository.findOne({
        where: { user: { id: userId } },
      });
      if (existingPatient) {
        throw new ConflictException(
          'This user already has a patient associated with them.',
        );
      }

      const newPatient = this.patientRepository.create({
        ...patientDto,
        user: { id: userId },
      });
      return await this.patientRepository.save(newPatient);
    } catch (error) {
      throw new InternalServerErrorException('Error creating a new patient');
    }
  }

  async findAllPatients(): Promise<Patient[]> {
    try {
      const patients = await this.patientRepository.find();
      if (!patients.length) {
        throw new NotFoundException('No patients found');
      }
      return patients;
    } catch (error) {
      throw new InternalServerErrorException('Error fetching patients');
    }
  }

  async findPatientById(id: string): Promise<Patient> {
    try {
      const patient = await this.patientRepository.findOne({ where: { id } });
      if (!patient) {
        throw new NotFoundException(`Patient with ID ${id} not found`);
      }
      return patient;
    } catch (error) {
      throw new InternalServerErrorException('Error fetching patient details');
    }
  }

  async updatePatient(id: string, patientDto: PatientDto): Promise<Patient> {
    try {
      const patient = await this.findPatientById(id);
      if (!patient) {
        throw new NotFoundException(`Patient with ID ${id} not found`);
      }

      await this.patientRepository.update(id, patientDto);
      return this.findPatientById(id);
    } catch (error) {
      throw new InternalServerErrorException('Error updating patient details');
    }
  }

  async deletePatient(id: string): Promise<void> {
    try {
      const result = await this.patientRepository.delete(id);
      if (result.affected === 0) {
        throw new NotFoundException(`Patient with ID ${id} not found`);
      }
    } catch (error) {
      throw new InternalServerErrorException('Error deleting patient');
    }
  }
}
