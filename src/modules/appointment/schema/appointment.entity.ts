import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { IsNumber, Min, Max } from 'class-validator';
import { Doctor } from 'src/modules/doctors/schemas/doctors.entity';
import { Patient } from 'src/modules/patient/schema/patient.entity';
import { Tenant } from 'src/modules/tenant/schema/tenant.entity';
import { Resource } from './resource.entity';

export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELED = 'canceled',
  NO_SHOW = 'no_show',
}

export enum ConsultationType {
  OFFLINE = 'offline',
  ONLINE = 'online',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  REFUNDED = 'refunded',
}

export enum AppointmentPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum AppointmentType {
  INITIAL_CONSULTATION = 'initial_consultation',
  FOLLOW_UP = 'follow_up',
  PROCEDURE = 'procedure',
  CHECKUP = 'checkup',
}

@Entity()
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  date: Date;

  @Column({ type: 'time' })
  time: string;

  @Column({ nullable: true })
  duration: string;

  @Column()
  reason: string;

  @Index()
  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.SCHEDULED,
  })
  status: AppointmentStatus;

  @Column({
    type: 'enum',
    enum: ConsultationType,
    default: ConsultationType.OFFLINE,
  })
  consultationType: ConsultationType;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  paymentStatus: PaymentStatus;

  @ManyToOne(() => Doctor, (doctor) => doctor.appointments)
  doctor: Doctor;

  @ManyToOne(() => Patient, (patient) => patient.appointments)
  patient: Patient;

  @ManyToOne(() => Tenant, (tenant) => tenant.appointments)
  tenant: Tenant;

  @Column({ nullable: true })
  cancelationReason: string;

  @Column({ default: false })
  isCanceled: boolean;

  @Column({ nullable: true })
  rescheduledDate: Date;

  @Column({ nullable: true })
  appointmentNumber: number;

  @Column({ default: true })
  isVisible: boolean;

  @Index()
  @Column({ unique: true })
  phoneNumber: string;

  @Column({ default: false })
  allowOverlap: boolean;

  @Column({ nullable: true })
  maxAppointmentsPerSlot: number;

  @Column({ default: false })
  endOfDay: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ nullable: true })
  timezone: string;

  @Column({ default: false })
  isConfirmed: boolean;

  @Column({ nullable: true })
  confirmationDate: Date;

  @Column({ nullable: true })
  reminderSentAt: Date;

  @Column({
    type: 'enum',
    enum: AppointmentPriority,
    default: AppointmentPriority.MEDIUM,
  })
  priority: AppointmentPriority;

  @Column({ type: 'simple-array', nullable: true })
  previousDates: Date[];

  @Column({ type: 'text', nullable: true })
  specialHandlingInstructions: string;

  @Column({ default: false })
  isFollowUp: boolean;

  @Column({ nullable: true })
  referralSource: string;

  @Column({ nullable: true })
  externalAppointmentId: string;

  @Column({ nullable: true })
  createdBy: string;

  @Column({ nullable: true })
  modifiedBy: string;

  @Column({ nullable: true })
  recurrenceRule: string;

  @Column({ default: false })
  isMissed: boolean;

  @Column({ nullable: true })
  telemedicineLink: string;

  @Column({ nullable: true })
  @IsNumber()
  @Min(0)
  cost: number;

  @Column({ nullable: true })
  appointmentOutcome: string;

  @Column({ nullable: true })
  waitingRoomTime: number;

  @Column({ type: 'text', nullable: true })
  patientFeedback: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  @IsNumber()
  @Min(0)
  @Max(5)
  doctorRating: number;

  @Column({ nullable: true })
  insuranceProvider: string;

  @Column({ nullable: true })
  insurancePolicyNumber: string;

  @Column({ nullable: true })
  emergencyContactName: string;

  @Column({ nullable: true })
  emergencyContactPhone: string;

  @Column({ nullable: true })
  followUpReminderSentAt: Date;

  @Column('simple-array', { nullable: true })
  medicalReports: string[];

  @Column({ nullable: true })
  paymentMethod: string;

  @Column({ nullable: true })
  thirdPartyReferrer: string;

  @Column({ nullable: true })
  locationName: string;

  @Column({ nullable: true })
  locationAddress: string;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude: number;

  @Column({ type: 'enum', enum: AppointmentType, nullable: true })
  appointmentType: AppointmentType;

  @Column({ nullable: true })
  billingCode: string;

  @Column({ nullable: true })
  invoiceNumber: string;

  @Column({ type: 'timestamp', nullable: true })
  patientArrivalTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  patientDepartureTime: Date;

  @Column({ type: 'text', nullable: true })
  preparationInstructions: string;

  @ManyToMany(() => Appointment)
  @JoinTable()
  relatedAppointments: Appointment[];

  @Column({ type: 'jsonb', nullable: true })
  customFields: Record<string, any>;

  @Column('simple-array', { nullable: true })
  tags: string[];

  @Column({ nullable: true })
  videoCallProvider: string;

  @Column({ nullable: true })
  videoCallRoomId: string;

  @ManyToMany(() => Resource)
  @JoinTable()
  allocatedResources: Resource[];

  @Column({ type: 'text', nullable: true })
  patientReportedSymptoms: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
