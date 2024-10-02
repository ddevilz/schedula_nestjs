import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doctor } from './schemas/doctors.entity';
import { DoctorBasicInfoDto } from './dto/doctor-basic-info.dto';
import {
  AvailabilitySlotDto,
  DoctorAvailabilityDto,
} from './dto/doctor-availability.dto';
import { DoctorSpecializationDto } from './dto/doctor-specialization.dto';
import { Specialization } from './schemas/specialization.entity';
import { ConsultingLocation } from './schemas/consulting-location.entity';
import { User } from '../users/schemas/user.entity';
import { isUUID } from 'class-validator';
import { DoctorSchedule } from './schemas/doctor-schedule.entity';
import { AvailabilityDay } from './enums/doctors.enum';

@Injectable()
export class DoctorsService {
  constructor(
    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,
    @InjectRepository(Specialization)
    private readonly specializationRepository: Repository<Specialization>,
    @InjectRepository(ConsultingLocation)
    private readonly locationRepository: Repository<ConsultingLocation>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(DoctorSchedule)
    private readonly doctorScheduleRepository: Repository<DoctorSchedule>,
  ) {}

  async findAllDoctors(): Promise<Doctor[]> {
    return this.doctorRepository.find();
  }

  async findDoctorById(id: string): Promise<Doctor> {
    const doctor = await this.doctorRepository.findOne({
      where: { id },
      relations: ['user', 'specialization', 'consultingLocation'], // Include related entities if necessary
    });

    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${id} not found`);
    }

    return doctor;
  }

  async onboardStep1(
    basicInfoDto: DoctorBasicInfoDto,
    userId: string,
  ): Promise<Doctor> {
    const existingDoctor = await this.doctorRepository.findOne({
      where: {
        user: {
          id: userId,
        },
      },
    });
    if (existingDoctor) {
      throw new ConflictException(
        'This user already has a doctor associated with them.',
      );
    }

    const newDoctor = this.doctorRepository.create({
      ...basicInfoDto,
      user: { id: userId },
    });
    const savedDoctor = await this.doctorRepository.save(newDoctor);

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    user.doctor = savedDoctor;
    await this.userRepository.save(user);

    return savedDoctor;
  }

  async onboardStep2(
    id: string,
    availabilityDto: DoctorAvailabilityDto,
  ): Promise<Doctor> {
    const doctor = await this.doctorRepository.findOne({ where: { id } });
    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${id} not found`);
    }

    if (availabilityDto.availability) {
      doctor.availability = availabilityDto.availability;
    }

    if (availabilityDto.consultationType) {
      doctor.consultationType = availabilityDto.consultationType;
    }

    if (availabilityDto.consultingLocationId) {
      const location = await this.locationRepository.findOne({
        where: { id: availabilityDto.consultingLocationId },
      });
      if (!location) {
        const { address, city, state, country, zipCode } =
          availabilityDto.consultingLocationDetails;
        const newLocation = this.locationRepository.create({
          address,
          city,
          state,
          country,
          zipCode,
        });
        await this.locationRepository.save(newLocation);
        doctor.consultationLocation = newLocation;
      } else {
        doctor.consultationLocation = location;
      }
    }

    if (availabilityDto.preferredGapBetweenAppointments) {
      doctor.preferredGapBetweenAppointments =
        availabilityDto.preferredGapBetweenAppointments;
    }

    if (availabilityDto.minConsultationTime) {
      doctor.minConsultationTime = availabilityDto.minConsultationTime;
    }

    if (availabilityDto.maxDailyConsultationTime) {
      doctor.maxDailyConsultationTime =
        availabilityDto.maxDailyConsultationTime;
    }

    if (availabilityDto.holidays) {
      doctor.holidays = availabilityDto.holidays;
    }

    return this.doctorRepository.save(doctor);
  }

  async onboardStep3(
    id: string,
    specializationDto: DoctorSpecializationDto,
  ): Promise<Doctor> {
    const doctor = await this.doctorRepository.findOne({ where: { id } });

    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${id} not found`);
    }

    let specialization: Specialization;

    if (isUUID(specializationDto.specializationId)) {
      specialization = await this.specializationRepository.findOne({
        where: { id: specializationDto.specializationId },
      });
    }

    if (!specialization) {
      specialization = this.specializationRepository.create({
        name: specializationDto.specializationId,
      });
      await this.specializationRepository.save(specialization);
    }

    doctor.specialization = specialization;

    if (specializationDto.consultationFee) {
      doctor.consultationFee = specializationDto.consultationFee;
    }
    if (specializationDto.status) {
      doctor.status = specializationDto.status;
    }

    if (specializationDto.specialConsultationRules) {
      doctor.specialConsultationRules =
        specializationDto.specialConsultationRules;
    }

    const savedDoctor = await this.doctorRepository.save(doctor);

    const sc = await this.createInitialSchedule(savedDoctor);
    if (sc.length === 0) {
      console.warn('No schedules were created for the doctor.');
    } else {
      console.log('Created schedules:', sc);
    }

    return savedDoctor;
  }

  private async createInitialSchedule(doctor: Doctor) {
    const today = new Date();
    const nextSaturday = this.getNextSaturday();
    const schedules = [];

    // Iterate over each day until next Saturday
    for (
      let current = new Date(today);
      current <= nextSaturday;
      current.setDate(current.getDate() + 1)
    ) {
      const date = new Date(current); // Create a new date instance for each loop
      const dayOfWeek = date.getDay();
      const availabilityDay = this.mapDayToAvailabilityDay(dayOfWeek);

      console.log(
        `Checking for doctor availability on ${availabilityDay} (Day of Week: ${dayOfWeek})`,
      );

      const availability = doctor.availability.find(
        (a) => a.day === availabilityDay.toUpperCase(),
      );

      // Validate availability data
      if (!availability) {
        console.warn(`No availability found for doctor on ${availabilityDay}`);
        continue;
      }

      // Validate slots and time range
      const isValid = this.validateAvailability(availability);
      if (!isValid) {
        console.warn(`Invalid availability for doctor on ${availabilityDay}`);
        continue;
      }

      const existingSchedule = await this.doctorScheduleRepository.findOne({
        where: { doctor: { id: doctor.id }, date: new Date(date) },
      });

      if (existingSchedule) {
        console.log(`Schedule already exists for doctor on ${date}`);
        continue;
      }

      const slots = this.generateTimeSlots(availability, new Date(date));

      // Validate generated slots
      if (!slots || slots.length === 0) {
        console.warn(`No slots generated for doctor on ${availabilityDay}`);
        continue;
      }

      const newSchedule = await this.doctorScheduleRepository.save({
        doctor,
        date: new Date(date),
        slots,
        totalSlots: slots.length,
        availableSlots: slots.length,
      });

      schedules.push(newSchedule); // Collect created schedules
    }

    if (schedules.length === 0) {
      console.warn('No schedules were created for the doctor.');
    }

    return schedules;
  }

  private validateAvailability(availability: AvailabilitySlotDto): boolean {
    const { startTime, endTime, slots, breakTimes } = availability;

    // Check if startTime is before endTime
    if (
      new Date(`1970-01-01T${startTime}:00Z`) >=
      new Date(`1970-01-01T${endTime}:00Z`)
    ) {
      console.warn('Invalid time range: startTime is not before endTime');
      return false;
    }

    // Check if the number of slots is a positive integer
    if (slots <= 0) {
      console.warn('Invalid number of slots');
      return false;
    }

    // Validate break times if they exist
    if (breakTimes) {
      for (const breakTime of breakTimes) {
        if (
          new Date(`1970-01-01T${breakTime.start}:00Z`) >=
          new Date(`1970-01-01T${breakTime.end}:00Z`)
        ) {
          console.warn('Invalid break time: start is not before end');
          return false;
        }
      }
    }

    return true;
  }

  private getNextSaturday(): Date {
    const today = new Date();
    const daysUntilSaturday = (6 - today.getDay() + 7) % 7;
    const nextSaturday = new Date(today);
    nextSaturday.setDate(today.getDate() + daysUntilSaturday);
    return nextSaturday;
  }

  @Cron('0 18 * * 6') // Runs at 6 PM (18:00) every Saturday
  async createSchedulesForNext7Days() {
    const doctors = await this.doctorRepository.find();
    const nextSunday = this.getNextSunday();

    for (const doctor of doctors) {
      for (let i = 0; i < 7; i++) {
        const date = new Date(nextSunday);
        date.setDate(nextSunday.getDate() + i);

        const dayOfWeek = date.getDay();
        const availabilityDay = this.mapDayToAvailabilityDay(dayOfWeek);

        const availability = doctor.availability.find(
          (a) => a.day === availabilityDay,
        );

        if (availability) {
          const existingSchedule = await this.doctorScheduleRepository.findOne({
            where: { doctor: { id: doctor.id }, date },
          });

          if (!existingSchedule) {
            const slots = this.generateTimeSlots(availability, date);
            await this.doctorScheduleRepository.save({
              doctor,
              date,
              slots,
              totalSlots: slots.length,
              availableSlots: slots.length,
            });
          }
        }
      }
    }
  }

  private getNextSunday(): Date {
    const today = new Date();
    const daysUntilSunday = 7 - today.getDay();
    const nextSunday = new Date(today);
    nextSunday.setDate(today.getDate() + daysUntilSunday);
    return nextSunday;
  }

  private mapDayToAvailabilityDay(day: number): AvailabilityDay {
    const map = {
      0: AvailabilityDay.SUNDAY,
      1: AvailabilityDay.MONDAY,
      2: AvailabilityDay.TUESDAY,
      3: AvailabilityDay.WEDNESDAY,
      4: AvailabilityDay.THURSDAY,
      5: AvailabilityDay.FRIDAY,
      6: AvailabilityDay.SATURDAY,
    };
    return map[day];
  }

  private generateTimeSlots(
    availability: Doctor['availability'][0],
    date: Date,
  ): DoctorSchedule['slots'] {
    const slots: DoctorSchedule['slots'] = [];
    const { startTime, endTime, slots: slotCount } = availability;

    const start = new Date(date);
    start.setHours(
      parseInt(startTime.split(':')[0], 10),
      parseInt(startTime.split(':')[1], 10),
      0,
      0,
    );

    const end = new Date(date);
    end.setHours(
      parseInt(endTime.split(':')[0], 10),
      parseInt(endTime.split(':')[1], 10),
      0,
      0,
    );

    const duration = (end.getTime() - start.getTime()) / slotCount;

    for (let i = 0; i < slotCount; i++) {
      const slotStart = new Date(start.getTime() + i * duration);
      const slotEnd = new Date(slotStart.getTime() + duration);

      slots.push({
        startTime: this.formatTime(slotStart),
        endTime: this.formatTime(slotEnd),
        available: true,
      });
    }

    return slots;
  }

  private formatTime(date: Date): string {
    return date.toTimeString().slice(0, 5);
  }
}
