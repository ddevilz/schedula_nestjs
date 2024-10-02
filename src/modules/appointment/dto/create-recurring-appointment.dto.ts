import {
  IsUUID,
  IsNotEmpty,
  IsString,
  IsDateString,
  IsEnum,
  Min,
} from 'class-validator';
import { ConsultationType } from '../enum'; // Assuming this enum is defined in `enum.ts`

export class CreateRecurringAppointmentDto {
  @IsUUID()
  @IsNotEmpty()
  patientId: string;

  @IsUUID()
  @IsNotEmpty()
  doctorId: string;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString() 
  endDate: string;

  @IsEnum(['weekly', 'biweekly', 'monthly'], {
    message: 'frequency must be one of weekly, biweekly, or monthly',
  })
  frequency: 'weekly' | 'biweekly' | 'monthly';

  @Min(1)
  @IsNotEmpty()
  duration: number;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsEnum(ConsultationType)
  consultationType: ConsultationType;
}
