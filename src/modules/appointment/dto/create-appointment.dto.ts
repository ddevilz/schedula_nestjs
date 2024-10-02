import {
  IsNotEmpty,
  IsString,
  IsDate,
  IsEnum,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsUUID,
  IsArray,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  AppointmentStatus,
  ConsultationType,
  PaymentStatus,
  AppointmentPriority,
  AppointmentType,
} from '../schema/appointment.entity';

export class CreateAppointmentDto {
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  date: Date;

  @IsNotEmpty()
  @IsString()
  time: string;

  @IsOptional()
  @IsString()
  duration?: string;

  @IsNotEmpty()
  @IsString()
  reason: string;

  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @IsOptional()
  @IsEnum(ConsultationType)
  consultationType?: ConsultationType;

  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @IsNotEmpty()
  @IsUUID()
  doctorId: string;

  @IsNotEmpty()
  @IsUUID()
  patientId: string;

  @IsUUID()
  @IsOptional()
  tenantId?: string;

  @IsOptional()
  @IsString()
  cancelationReason?: string;

  @IsOptional()
  @IsBoolean()
  isCanceled?: boolean;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  rescheduledDate?: Date;

  @IsOptional()
  @IsNumber()
  appointmentNumber?: number;

  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsBoolean()
  allowOverlap?: boolean;

  @IsOptional()
  @IsNumber()
  maxAppointmentsPerSlot?: number;

  @IsOptional()
  @IsBoolean()
  endOfDay?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsBoolean()
  isConfirmed?: boolean;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  confirmationDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  reminderSentAt?: Date;

  @IsOptional()
  @IsEnum(AppointmentPriority)
  priority?: AppointmentPriority;

  @IsOptional()
  @IsArray()
  @IsDate({ each: true })
  @Type(() => Date)
  previousDates?: Date[];

  @IsOptional()
  @IsString()
  specialHandlingInstructions?: string;

  @IsOptional()
  @IsBoolean()
  isFollowUp?: boolean;

  @IsOptional()
  @IsString()
  referralSource?: string;

  @IsOptional()
  @IsString()
  externalAppointmentId?: string;

  @IsOptional()
  @IsString()
  recurrenceRule?: string;

  @IsOptional()
  @IsBoolean()
  isMissed?: boolean;

  @IsOptional()
  @IsString()
  telemedicineLink?: string;

  @IsOptional()
  @IsNumber()
  cost?: number;

  @IsOptional()
  @IsString()
  appointmentOutcome?: string;

  @IsOptional()
  @IsNumber()
  waitingRoomTime?: number;

  @IsOptional()
  @IsString()
  patientFeedback?: string;

  @IsOptional()
  @IsNumber()
  doctorRating?: number;

  @IsOptional()
  @IsString()
  insuranceProvider?: string;

  @IsOptional()
  @IsString()
  insurancePolicyNumber?: string;

  @IsOptional()
  @IsString()
  emergencyContactName?: string;

  @IsOptional()
  @IsString()
  emergencyContactPhone?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  medicalReports?: string[];

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  thirdPartyReferrer?: string;

  @IsOptional()
  @IsString()
  locationName?: string;

  @IsOptional()
  @IsString()
  locationAddress?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsEnum(AppointmentType)
  appointmentType?: AppointmentType;

  @IsOptional()
  @IsString()
  billingCode?: string;

  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  patientArrivalTime?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  patientDepartureTime?: Date;

  @IsOptional()
  @IsString()
  preparationInstructions?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  relatedAppointments?: string[];

  @IsOptional()
  @IsObject()
  customFields?: Record<string, any>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  videoCallProvider?: string;

  @IsOptional()
  @IsString()
  videoCallRoomId?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  allocatedResourceIds?: string[];

  @IsOptional()
  @IsString()
  patientReportedSymptoms?: string;
}

// // dto/update-appointment.dto.ts
// import { PartialType } from '@nestjs/mapped-types';
// import { CreateAppointmentDto } from './create-appointment.dto';

// export class UpdateAppointmentDto extends PartialType(CreateAppointmentDto) {}
