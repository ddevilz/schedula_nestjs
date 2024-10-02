import {
  IsString,
  IsOptional,
  IsInt,
  IsArray,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DoctorStatus } from '../enums/doctors.enum';

export class SpecialConsultationRuleDto {
  @IsString()
  consultationType: string;

  @IsInt()
  requiredDuration: number;
}

export class DoctorSpecializationDto {
  @IsString()
  specializationId: string;

  @IsInt()
  @IsOptional()
  consultationFee?: number;

  @IsEnum(DoctorStatus)
  @IsOptional()
  status?: DoctorStatus;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SpecialConsultationRuleDto)
  @IsOptional()
  specialConsultationRules?: SpecialConsultationRuleDto[];

  @IsInt()
  @IsOptional()
  maxConcurrentAppointments?: number; // Max concurrent appointments
}
