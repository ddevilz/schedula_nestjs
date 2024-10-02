import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentsController } from './appointment.controller';
import { AppointmentsService } from './appointment.service';
import { Appointment } from './schema/appointment.entity';
import { Doctor } from '../doctors/schemas/doctors.entity';
import { Patient } from '../patient/schema/patient.entity';
import { Waitlist } from './schema/waitlist.entity';
import { DoctorSchedule } from '../doctors/schemas/doctor-schedule.entity';
import { Resource } from './schema/resource.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Appointment,
      Doctor,
      Patient,
      Waitlist,
      DoctorSchedule,
      Resource
    ]),
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
})
export class AppointmentModule {}
