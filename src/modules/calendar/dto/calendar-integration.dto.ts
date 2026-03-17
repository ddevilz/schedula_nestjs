import { IsString, IsEnum, IsNotEmpty, IsOptional, IsEmail, IsBoolean } from 'class-validator';
import { CalendarProvider } from '../schema/calendar-integration.entity';

export class CreateCalendarIntegrationDto {
  @IsEnum(CalendarProvider)
  @IsNotEmpty()
  provider: CalendarProvider;

  @IsString()
  @IsNotEmpty()
  calendarId: string;

  @IsString()
  @IsNotEmpty()
  accessToken: string;

  @IsString()
  @IsNotEmpty()
  refreshToken: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsBoolean()
  @IsOptional()
  syncEnabled?: boolean = true;

  @IsOptional()
  providerData?: Record<string, any>;
}

export class UpdateCalendarIntegrationDto {
  @IsString()
  @IsOptional()
  accessToken?: string;

  @IsString()
  @IsOptional()
  refreshToken?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  syncEnabled?: boolean;

  @IsOptional()
  providerData?: Record<string, any>;
}

export class SyncCalendarDto {
  @IsString()
  @IsNotEmpty()
  calendarIntegrationId: string;

  @IsString()
  @IsOptional()
  syncType?: 'full' | 'incremental' = 'incremental';
}

export class CalendarEventDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  startTime: string;

  @IsString()
  @IsNotEmpty()
  endTime: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  attendees?: string;

  @IsString()
  @IsOptional()
  externalEventId?: string;
}
