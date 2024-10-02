import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  Between,
  LessThanOrEqual,
  MoreThanOrEqual,
  DataSource,
  EntityManager,
  DeepPartial,
} from 'typeorm';
import {
  addMinutes,
  parse,
  format,
  isWithinInterval,
  isSameDay,
  subHours,
} from 'date-fns';
import { v4 as uuid } from 'uuid';
import { Appointment } from './schema/appointment.entity';
import { Doctor } from '../doctors/schemas/doctors.entity';
import { Patient } from '../patient/schema/patient.entity';
import { Waitlist } from './schema/waitlist.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { AppointmentStatus, ConsultationType } from './enum';
import { DoctorSchedule } from '../doctors/schemas/doctor-schedule.entity';
import { AddToWaitlistDto } from './dto/add-to-waitlist.dto';

interface BreakTime {
  start: string;
  end: string;
}

interface DoctorAvailability {
  day: string;
  startTime: string;
  endTime: string;
  slots: number;
  breakTimes?: BreakTime[];
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
  bookingId?: string;
  appointmentNumber?: number;
  reportingTime?: Date;
}

interface Holiday {
  date: string;
  reason: string;
}

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    @InjectRepository(DoctorSchedule)
    private doctorScheduleRepository: Repository<DoctorSchedule>,
    @InjectRepository(Waitlist)
    private readonly waitlistRepository: Repository<Waitlist>,
    private dataSource: DataSource,
  ) {}

  async scheduleAppointment(
    createAppointmentDto: CreateAppointmentDto,
  ): Promise<Appointment> {
    const {
      doctorId,
      patientId,
      date,
      time,
      duration,
      phoneNumber,
      reason,
      consultationType,
    } = createAppointmentDto;

    const appointmentDate = new Date(`${date}T${time}`);
    const now = new Date();
    // if (appointmentDate.getTime() - now.getTime() < 24 * 60 * 60 * 1000) {
    //   throw new ConflictException(
    //     'Appointments must be booked at least 24 hours in advance',
    //   );
    // }

    return this.dataSource.transaction(async (transactionalEntityManager) => {
      const [doctor, patient] = await Promise.all([
        transactionalEntityManager.findOne(Doctor, { where: { id: doctorId } }),
        transactionalEntityManager.findOne(Patient, {
          where: { id: patientId },
        }),
      ]);

      if (!doctor || !patient) {
        throw new NotFoundException('Doctor or patient not found');
      }

      const startOfDay = new Date(appointmentDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(appointmentDate);
      endOfDay.setHours(23, 59, 59, 999);

      const existingAppointment = await transactionalEntityManager.findOne(
        Appointment,
        {
          where: {
            phoneNumber: phoneNumber ? phoneNumber : patient.phoneNumber,
            date: Between(startOfDay, endOfDay),
          },
        },
      );

      if (existingAppointment) {
        throw new ConflictException(
          'An appointment with this phone number has already been booked on this day',
        );
      }

      await this.checkHoliday(doctor, appointmentDate);

      const doctorSchedule =
        await this.checkDoctorAvailabilityAndCreateSchedule(
          transactionalEntityManager,
          doctor,
          appointmentDate,
          time,
          parseInt(duration),
        );

      const appointment = this.appointmentRepository.create({
        doctor,
        patient,
        date: appointmentDate,
        time,
        duration,
        phoneNumber: phoneNumber ? phoneNumber : patient.phoneNumber,
        reason,
        consultationType,
      });

      await transactionalEntityManager.save(appointment);

      doctorSchedule.availableSlots--;
      await transactionalEntityManager.save(doctorSchedule);

      return appointment;
    });
  }

  async rescheduleAppointment(
    appointmentId: string,
    newDate: Date,
    newTime: string,
  ): Promise<Appointment> {
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      const appointment = await transactionalEntityManager.findOne(
        Appointment,
        {
          where: { id: appointmentId },
          relations: ['doctor', 'patient'],
        },
      );

      if (!appointment) {
        throw new NotFoundException('Appointment not found');
      }

      const newAppointmentDate = new Date(
        `${format(newDate, 'yyyy-MM-dd')}T${newTime}`,
      );

      if (!appointment.previousDates) {
        appointment.previousDates = [];
      }
      appointment.previousDates.push(
        new Date(`${appointment.date}T${appointment.time}`),
      );

      // Cancel the old appointment
      await this.cancelAppointmentInternal(
        transactionalEntityManager,
        appointment,
      );

      // Schedule the new appointment
      const rescheduledAppointment = await this.scheduleAppointmentInternal(
        transactionalEntityManager,
        {
          doctorId: appointment.doctor.id,
          patientId: appointment.patient.id,
          date: new Date(format(newDate, 'yyyy-MM-dd')),
          time: newTime,
          duration: appointment.duration,
          phoneNumber: appointment.phoneNumber,
          reason: appointment.reason,
          consultationType: appointment.consultationType,
        },
      );

      rescheduledAppointment.rescheduledDate = newAppointmentDate;

      return transactionalEntityManager.save(rescheduledAppointment);
    });
  }

  private async scheduleAppointmentInternal(
    transactionalEntityManager: EntityManager,
    createAppointmentDto: CreateAppointmentDto,
  ): Promise<Appointment> {
    const {
      doctorId,
      patientId,
      date,
      time,
      duration,
      phoneNumber,
      reason,
      consultationType,
    } = createAppointmentDto;

    const appointmentDate = new Date(`${date}T${time}`);

    const [doctor, patient] = await Promise.all([
      transactionalEntityManager.findOne(Doctor, { where: { id: doctorId } }),
      transactionalEntityManager.findOne(Patient, { where: { id: patientId } }),
    ]);

    if (!doctor || !patient) {
      throw new NotFoundException('Doctor or patient not found');
    }

    await this.checkHoliday(doctor, appointmentDate);

    const doctorSchedule = await this.checkDoctorAvailabilityAndCreateSchedule(
      transactionalEntityManager,
      doctor,
      date,
      time,
      parseInt(duration),
    );

    const appointment = this.appointmentRepository.create({
      doctor,
      patient,
      date,
      time,
      duration,
      phoneNumber: phoneNumber ? phoneNumber : patient.phoneNumber,
      reason,
      consultationType,
    });

    await transactionalEntityManager.save(appointment);

    doctorSchedule.availableSlots--;
    await transactionalEntityManager.save(doctorSchedule);

    return appointment;
  }

  async rescheduleDoctorAppointments(
    doctorId: string,
    oldDate: Date,
    newDate: Date,
    timeOffset: number, // in minutes
  ): Promise<void> {
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      const appointments = await transactionalEntityManager.find(Appointment, {
        where: {
          doctor: { id: doctorId },
          date: Between(
            new Date(oldDate.setHours(0, 0, 0, 0)),
            new Date(oldDate.setHours(23, 59, 59, 999)),
          ),
        },
        relations: ['doctor', 'patient'],
      });

      for (const appointment of appointments) {
        const oldTime = parse(appointment.time, 'HH:mm', appointment.date);
        const newTime = addMinutes(oldTime, timeOffset);

        await this.rescheduleAppointment(
          appointment.id,
          newDate,
          format(newTime, 'HH:mm'),
        );

        // Notify patient about rescheduling (implement notification service)
        // await this.notificationService.notifyPatient(appointment.patient, 'appointment_rescheduled_by_doctor');
      }
    });
  }

  private async checkDoctorAvailabilityAndCreateSchedule(
    transactionalEntityManager: EntityManager,
    doctor: Doctor,
    appointmentDate: Date,
    appointmentTime: string,
    duration: number,
  ): Promise<DoctorSchedule> {
    const dayOfWeek = this.getDayOfWeek(appointmentDate);

    const doctorAvailability = doctor.availability.find(
      (avail) => avail.day === dayOfWeek,
    );
    if (!doctorAvailability) {
      throw new ConflictException(`Doctor is not available on ${dayOfWeek}`);
    }

    let doctorSchedule = await transactionalEntityManager.findOne(
      DoctorSchedule,
      {
        where: { doctor: { id: doctor.id }, date: appointmentDate },
        lock: { mode: 'pessimistic_write' },
      },
    );

    if (!doctorSchedule) {
      const generatedSlots = this.generateTimeSlots(
        doctorAvailability,
        duration,
        appointmentDate,
      );
      doctorSchedule = this.doctorScheduleRepository.create({
        doctor,
        date: appointmentDate,
        totalSlots: generatedSlots.length,
        availableSlots: generatedSlots.length,
        slots: generatedSlots,
      } as DeepPartial<DoctorSchedule>);
      doctorSchedule = await transactionalEntityManager.save(doctorSchedule);
    }

    if (doctorSchedule.availableSlots <= 0) {
      throw new ConflictException('No available slots for the selected date.');
    }

    const slot = doctorSchedule.slots.find(
      (s) => s.startTime === appointmentTime && s.available,
    );
    if (!slot) {
      throw new ConflictException('The selected time slot is not available.');
    }

    slot.available = false;
    slot.bookingId = uuid();

    return doctorSchedule;
  }

  private generateTimeSlots(
    availability: DoctorAvailability,
    appointmentDuration: number,
    date: Date,
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const startTime = parse(availability.startTime, 'HH:mm', date);
    const endTime = parse(availability.endTime, 'HH:mm', date);

    let currentTime = startTime;

    while (currentTime < endTime) {
      const slotEndTime = addMinutes(currentTime, appointmentDuration);

      const isBreakTime = availability.breakTimes.some((breakTime) => {
        const breakStart = parse(breakTime.start, 'HH:mm', date);
        const breakEnd = parse(breakTime.end, 'HH:mm', date);
        return (
          isWithinInterval(currentTime, { start: breakStart, end: breakEnd }) ||
          isWithinInterval(slotEndTime, { start: breakStart, end: breakEnd }) ||
          (currentTime <= breakStart && slotEndTime >= breakEnd)
        );
      });

      if (!isBreakTime && slotEndTime <= endTime) {
        slots.push({
          startTime: format(currentTime, 'HH:mm'),
          endTime: format(slotEndTime, 'HH:mm'),
          available: true,
        });
      }

      currentTime = slotEndTime;
    }

    return slots.slice(0, availability.slots);
  }

  private getDayOfWeek(date: Date): string {
    return [
      'SUNDAY',
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
    ][date.getDay()];
  }

  private async checkHoliday(
    doctor: Doctor,
    appointmentDate: Date,
  ): Promise<void> {
    const isHoliday = doctor.holidays.some((holiday) =>
      isSameDay(new Date(holiday.date), appointmentDate),
    );

    if (isHoliday) {
      const holiday = doctor.holidays.find((h) =>
        isSameDay(new Date(h.date), appointmentDate),
      );
      throw new ConflictException(
        `Doctor is not available on ${format(appointmentDate, 'yyyy-MM-dd')} due to ${holiday.reason}`,
      );
    }
  }

  async getAvailableSlots(doctorId: string, date: Date): Promise<TimeSlot[]> {
    const doctor = await this.doctorRepository.findOne({
      where: { id: doctorId },
    });
    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    await this.checkHoliday(doctor, date);

    const schedule = await this.doctorScheduleRepository.findOne({
      where: { doctor: { id: doctorId }, date },
    });

    let availableSlots: TimeSlot[];

    if (!schedule) {
      const dayOfWeek = this.getDayOfWeek(date);
      const availability = doctor.availability.find(
        (avail) => avail.day === dayOfWeek,
      );
      if (!availability) {
        return [];
      }
      availableSlots = this.generateTimeSlots(availability, 30, date);
    } else {
      availableSlots = schedule.slots.filter((slot) => slot.available);
    }

    // Sort slots by start time
    availableSlots.sort((a, b) => a.startTime.localeCompare(b.startTime));

    // Assign appointment numbers and reporting times
    availableSlots.forEach((slot, index) => {
      slot.appointmentNumber = index + 1;
      slot.reportingTime = subHours(parse(slot.startTime, 'HH:mm', date), 1);
    });

    return availableSlots;
  }

  async cancelAppointment(appointmentId: string): Promise<void> {
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      const appointment = await transactionalEntityManager.findOne(
        Appointment,
        {
          where: { id: appointmentId },
          relations: ['doctor'],
        },
      );

      if (!appointment) {
        throw new NotFoundException('Appointment not found');
      }

      const schedule = await transactionalEntityManager.findOne(
        DoctorSchedule,
        {
          where: {
            doctor: { id: appointment.doctor.id },
            date: appointment.date,
          },
          lock: { mode: 'pessimistic_write' },
        },
      );

      if (schedule) {
        const slot = schedule.slots.find(
          (s) => s.startTime === appointment.time,
        );
        if (slot) {
          slot.available = true;
          slot.bookingId = undefined;
          schedule.availableSlots++;
          await transactionalEntityManager.save(schedule);
        }
      }

      await transactionalEntityManager.remove(appointment);
    });
  }

  private async cancelAppointmentInternal(
    transactionalEntityManager: EntityManager,
    appointment: Appointment,
  ): Promise<void> {
    const schedule = await transactionalEntityManager.findOne(DoctorSchedule, {
      where: {
        doctor: { id: appointment.doctor.id },
        date: appointment.date,
      },
      lock: { mode: 'pessimistic_write' },
    });

    if (schedule) {
      const slot = schedule.slots.find((s) => s.startTime === appointment.time);
      if (slot) {
        slot.available = true;
        slot.bookingId = undefined;
        schedule.availableSlots++;
        await transactionalEntityManager.save(schedule);
      }
    }

    await transactionalEntityManager.remove(appointment);
  }

  private async updateScheduleForCanceledAppointment(
    transactionalEntityManager: EntityManager,
    appointment: Appointment,
  ): Promise<void> {
    const schedule = await transactionalEntityManager.findOne(DoctorSchedule, {
      where: {
        doctor: { id: appointment.doctor.id },
        date: appointment.date,
      },
      lock: { mode: 'pessimistic_write' },
    });

    if (schedule) {
      const slot = schedule.slots.find((s) => s.startTime === appointment.time);

      if (slot) {
        slot.available = true;
        slot.bookingId = undefined;
        schedule.availableSlots++;

        await transactionalEntityManager.save(schedule);
      }
    } else {
      throw new NotFoundException(
        'Doctor schedule not found for the specified date',
      );
    }
  }

  async addToWaitlist(
    createWaitlistEntry: AddToWaitlistDto,
  ): Promise<Waitlist> {
    const patient = await this.patientRepository.findOne({
      where: { id: createWaitlistEntry.patientId },
    });
    const doctor = await this.doctorRepository.findOne({
      where: { id: createWaitlistEntry.doctorId },
    });

    if (!patient || !doctor) {
      throw new NotFoundException('Patient or doctor not found');
    }

    // Check for existing waitlist entry to avoid duplicates
    const existingWaitlistEntry = await this.waitlistRepository.findOne({
      where: {
        patient: { id: createWaitlistEntry.patientId },
        doctor: { id: createWaitlistEntry.doctorId },
      },
    });

    if (existingWaitlistEntry) {
      throw new ConflictException(
        'Waitlist entry for this patient and doctor already exists',
      );
    }

    const waitlistEntry = this.waitlistRepository.create({
      patient,
      doctor,
      preferredDate: createWaitlistEntry.preferredDate,
      reason: createWaitlistEntry.reason,
    });

    return this.waitlistRepository.save(waitlistEntry);
  }

  async processWaitlist(
    transactionalEntityManager: EntityManager,
    appointment: Appointment,
  ): Promise<void> {
    const waitlistEntries = await transactionalEntityManager.find(Waitlist, {
      where: {
        doctor: { id: appointment.doctor.id },
        preferredDate: LessThanOrEqual(appointment.date),
      },
      order: {
        createdAt: 'ASC',
      },
      relations: ['patient'],
    });

    if (waitlistEntries.length > 0) {
      const nextInLine = waitlistEntries[0];
      await this.assignAppointmentFromWaitlist(
        transactionalEntityManager,
        nextInLine,
        appointment,
      );
    }
  }

  private async assignAppointmentFromWaitlist(
    transactionalEntityManager: EntityManager,
    waitlistEntry: Waitlist,
    cancelledAppointment: Appointment,
  ): Promise<void> {
    const newAppointment = this.appointmentRepository.create({
      doctor: cancelledAppointment.doctor,
      patient: waitlistEntry.patient,
      date: cancelledAppointment.date,
      time: cancelledAppointment.time,
      duration: cancelledAppointment.duration,
      phoneNumber: waitlistEntry.patient.phoneNumber,
      reason: waitlistEntry.reason,
      consultationType: cancelledAppointment.consultationType,
    });

    await transactionalEntityManager.save(newAppointment);

    await transactionalEntityManager.remove(waitlistEntry);

    const schedule = await transactionalEntityManager.findOne(DoctorSchedule, {
      where: {
        doctor: { id: cancelledAppointment.doctor.id },
        date: cancelledAppointment.date,
      },
      lock: { mode: 'pessimistic_write' },
    });

    if (schedule) {
      const slot = schedule.slots.find(
        (s) => s.startTime === cancelledAppointment.time,
      );
      if (slot) {
        slot.available = false;
        slot.bookingId = uuid();
        await transactionalEntityManager.save(schedule);
      } else {
        throw new NotFoundException('Time slot not found in the schedule');
      }
    }

    // Notify the patient about the assigned appointment (implement notification service)
    // await this.notificationService.notifyPatient(waitlistEntry.patient, 'appointment_assigned_from_waitlist');
  }

  async cancelAppointmentByDoctor(
    appointmentId: string,
    reason: string,
  ): Promise<void> {
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      try {
        const appointment = await transactionalEntityManager.findOne(
          Appointment,
          {
            where: { id: appointmentId },
            relations: ['doctor', 'patient'],
          },
        );

        if (!appointment) {
          throw new NotFoundException('Appointment not found');
        }

        if (appointment.isCanceled) {
          throw new ConflictException('Appointment is already canceled');
        }

        appointment.isCanceled = true;
        appointment.cancelationReason = reason;
        appointment.modifiedBy = 'doctor';

        await transactionalEntityManager.save(appointment);

        // Update doctor's schedule for canceled appointment
        try {
          await this.updateScheduleForCanceledAppointment(
            transactionalEntityManager,
            appointment,
          );
        } catch (error) {
          console.error('Error updating schedule:', error);
        }

        try {
          await this.processWaitlist(transactionalEntityManager, appointment);
        } catch (error) {
          console.error('Error processing waitlist:', error);
        }
      } catch (error) {
        console.error('Error during cancelAppointmentByDoctor:', error);
        throw error;
      }
    });
  }

  async cancelAppointmentByPatient(
    appointmentId: string,
    reason: string,
  ): Promise<void> {
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      const appointment = await transactionalEntityManager.findOne(
        Appointment,
        {
          where: { id: appointmentId },
          relations: ['doctor', 'patient'],
        },
      );

      if (!appointment) {
        throw new NotFoundException('Appointment not found');
      }

      // Check if the appointment is already canceled
      if (appointment.isCanceled) {
        throw new ConflictException('Appointment is already canceled');
      }

      // Check if cancellation is within the allowed time frame
      const cancellationDeadline = subHours(appointment.date, 24);
      if (new Date() > cancellationDeadline) {
        throw new ConflictException(
          'Appointments can only be cancelled at least 24 hours in advance',
        );
      }

      appointment.isCanceled = true;
      appointment.cancelationReason = reason;
      appointment.modifiedBy = 'patient';

      await transactionalEntityManager.save(appointment);

      await this.updateScheduleForCanceledAppointment(
        transactionalEntityManager,
        appointment,
      );

      // Process waitlist after cancellation
      // await this.processWaitlist(appointment);

      // Notify doctor about cancellation (implement notification service)
      // await this.notificationService.notifyDoctor(appointment.doctor, 'appointment_cancelled_by_patient');
    });
  }
}
