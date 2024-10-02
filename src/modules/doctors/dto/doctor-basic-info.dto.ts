import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsArray,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { ConsultationType } from '../enums/doctors.enum';

export class DoctorBasicInfoDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  email: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsString()
  @IsOptional()
  profilePictureUrl?: string;

  @IsEnum(ConsultationType)
  @IsOptional()
  consultationType?: ConsultationType;

  @IsString()
  @IsOptional()
  licenseNumber?: string; // License number

  @IsDateString()
  @IsOptional()
  licenseExpiryDate?: Date; // License expiry date

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  certifications?: string[]; // List of certifications

  @IsBoolean()
  @IsOptional()
  telemedicineAvailable?: boolean; // Whether telemedicine is available

  @IsString()
  @IsOptional()
  telemedicinePlatform?: string; // Platform used for telemedicine

  @IsInt()
  @IsOptional()
  yearsOfExperience?: number; // Years of experience

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  languagesSpoken?: string[]; // Languages spoken
}
