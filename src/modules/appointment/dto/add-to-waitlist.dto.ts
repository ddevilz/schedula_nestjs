import { IsUUID, IsNotEmpty, IsString, IsDateString } from 'class-validator';

export class AddToWaitlistDto {
  @IsUUID()
  @IsNotEmpty()
  patientId: string;

  @IsUUID()
  @IsNotEmpty()
  doctorId: string;

  @IsDateString()
  @IsNotEmpty()
  preferredDate: string;

  @IsString()
  reason: string;
}
