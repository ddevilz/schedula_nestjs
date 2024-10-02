import { IsUUID, IsNotEmpty, IsString } from 'class-validator';

export class CreateEmergencyAppointmentDto {
  @IsUUID()
  @IsNotEmpty()
  patientId: string;

  @IsUUID()
  @IsNotEmpty()
  doctorId: string;

  @IsString()
  @IsNotEmpty()
  reason: string;
}
