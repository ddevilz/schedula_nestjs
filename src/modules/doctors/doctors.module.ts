import { Module } from '@nestjs/common';
import { DoctorsController } from './doctors.controller';
import { DoctorsService } from './doctors.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Doctor } from './schemas/doctors.entity';
import { Specialization } from './schemas/specialization.entity';
import { ConsultingLocation } from './schemas/consulting-location.entity';
import { User } from '../users/schemas/user.entity';
import { DoctorSchedule } from './schemas/doctor-schedule.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Doctor,
      Specialization,
      ConsultingLocation,
      User,
      DoctorSchedule,
    ]),
  ],
  controllers: [DoctorsController],
  providers: [DoctorsService],
  exports: [DoctorsService],
})
export class DoctorsModule {}
