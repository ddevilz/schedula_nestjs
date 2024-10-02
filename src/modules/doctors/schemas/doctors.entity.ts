import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import {
  ConsultationType,
  DoctorStatus,
  AvailabilityDay,
} from '../enums/doctors.enum';
import { Specialization } from './specialization.entity';
import { ConsultingLocation } from './consulting-location.entity';
import { User } from '../../users/schemas/user.entity';
import { Appointment } from '../../appointment/schema/appointment.entity';
import { Organization } from './organization.entity';
import { Tenant } from 'src/modules/tenant/schema/tenant.entity';
import { DoctorSchedule } from './doctor-schedule.entity';
import { Waitlist } from 'src/modules/appointment/schema/waitlist.entity';
import { Exclude } from 'class-transformer';

@Entity()
export class Doctor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, (user) => user.doctor)
  @JoinColumn()
  user: User;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ nullable: true })
  profilePictureUrl: string;

  @ManyToOne(() => Specialization, (specialization) => specialization.doctors)
  specialization: Specialization;

  @Column({
    type: 'enum',
    enum: ConsultationType,
    default: ConsultationType.BOTH,
  })
  consultationType: ConsultationType;

  @Column({ type: 'int', default: 20 })
  maxPatientsPerDay: number;

  @Column({ type: 'json', nullable: true })
  availability: {
    day: AvailabilityDay;
    startTime: string;
    endTime: string;
    slots: number;
    breakTimes?: { start: string; end: string }[];
  }[];

  @OneToMany(() => DoctorSchedule, (schedule) => schedule.doctor)
  schedules: DoctorSchedule[];

  @Exclude()
  @OneToMany(() => Waitlist, (waitlist) => waitlist.doctor)
  waitlistEntries: Waitlist[];

  @Column({ type: 'int', default: 2 })
  emergencySlotsPerDay: number;

  @Column({ type: 'json', nullable: true })
  aiSchedulingPreferences: {
    preferredPatientTypes: string[];
    specialtyFocus: string[];
  };

  @ManyToOne(() => ConsultingLocation, (location) => location.doctors, {
    nullable: true,
  })
  consultationLocation: ConsultingLocation;

  @Column({ nullable: true })
  consultationFee: number;

  @Column({ type: 'int', nullable: true })
  minConsultationTime: number;

  @Column({ type: 'int', nullable: true })
  maxConsultationTime: number;

  @Column({ type: 'json', nullable: true })
  holidays: {
    date: Date;
    reason?: string;
  }[];

  @Column({ type: 'int', nullable: true })
  preferredGapBetweenAppointments: number; // Time in minutes

  @Column({ type: 'int', nullable: true })
  maxDailyConsultationTime: number; // Total consultation time in minutes per day

  @Column({ type: 'json', nullable: true })
  specialConsultationRules: {
    consultationType: string;
    requiredDuration: number;
  }[];

  @Column({ type: 'float', nullable: true, default: 0 })
  rating: number; // Average rating from patients

  @Column({ type: 'int', default: 0 })
  totalReviews: number; // Total number of reviews received

  @Column({ nullable: true })
  timeZone: string;

  @Column({ type: 'json', nullable: true })
  languagesSpoken: string[];

  @Column({ type: 'boolean', default: false })
  telemedicineAvailable: boolean; // Whether telemedicine is available

  @Column({ nullable: true })
  telemedicinePlatform: string;

  @Column({ nullable: true })
  licenseNumber: string;

  @Column({ nullable: true })
  licenseExpiryDate: Date;

  @Column({ type: 'json', nullable: true })
  certifications: string[]; // List of certifications

  @Column({ type: 'json', nullable: true })
  consultationFees: {
    consultationType: string; // Define ConsultationType enum if needed
    fee: number;
  }[];

  @Column({ type: 'int', default: 1 })
  maxConcurrentAppointments: number; // The number of appointments the doctor can handle at the same time

  @Column({ type: 'int', nullable: true })
  yearsOfExperience: number; // Number of years of professional experience

  @Column({ type: 'json', nullable: true })
  notificationPreferences: {
    method: string; // e.g., "email", "SMS"
    sendBeforeAppointment: number; // Time in minutes before the appointment to notify the doctor
  };

  @Column({ type: 'json', nullable: true })
  workloadPreferences: {
    maxAppointmentsBeforeBreak: number;
    requiredBreakDuration: number; // in minutes
  };

  @Column({
    type: 'enum',
    enum: DoctorStatus,
    default: DoctorStatus.UNVERIFIED,
  })
  status: DoctorStatus;

  @ManyToOne(() => Organization, (organization) => organization.doctors)
  organization: Organization;

  @ManyToOne(() => Tenant, (tenant) => tenant.doctors)
  tenant: Tenant;

  @OneToMany(() => Appointment, (appointment) => appointment.doctor)
  appointments: Appointment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
