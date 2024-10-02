import {
  IsString,
  IsOptional,
  IsInt,
  IsArray,
  IsEnum,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AvailabilityDay, ConsultationType } from '../enums/doctors.enum';

export class BreakTimeDto {
  @IsString()
  start: string;

  @IsString()
  end: string;
}

export class ConsultingLocationDto {
  @IsString()
  address: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  zipCode?: string;
}

export class HolidayDto {
  @IsString()
  date: Date;

  @IsString()
  @IsOptional()
  reason?: string;
}

export class AvailabilitySlotDto {
  @IsEnum(AvailabilityDay)
  day: AvailabilityDay;

  @IsString()
  startTime: string;

  @IsString()
  endTime: string;

  @IsInt()
  slots: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BreakTimeDto)
  @IsOptional()
  breakTimes?: BreakTimeDto[];
}

export class DoctorAvailabilityDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AvailabilitySlotDto)
  availability: AvailabilitySlotDto[];

  @IsEnum(ConsultationType)
  @IsOptional()
  consultationType?: ConsultationType;

  @IsString()
  @IsOptional()
  consultingLocationId?: string;

  @ValidateNested()
  @IsOptional()
  @Type(() => ConsultingLocationDto)
  consultingLocationDetails?: ConsultingLocationDto;

  @IsInt()
  @IsOptional()
  preferredGapBetweenAppointments?: number;

  @IsInt()
  @IsOptional()
  minConsultationTime?: number;

  @IsInt()
  @IsOptional()
  maxDailyConsultationTime?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @IsOptional()
  @Type(() => HolidayDto)
  holidays?: HolidayDto[];

  @IsBoolean()
  @IsOptional()
  telemedicineAvailable?: boolean; // Whether telemedicine is available

  @IsString()
  @IsOptional()
  telemedicinePlatform?: string; // Platform used for telemedicine
}
