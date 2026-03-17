import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CalendarService } from './calendar.service';
import { CalendarEventDto } from './dto/calendar-integration.dto';
import { CalendarIntegration } from './schema/calendar-integration.entity';
import { Appointment } from '../appointment/schema/appointment.entity';
import { User } from '../users/schemas/user.entity';

@Injectable()
export class AppointmentCalendarService {
  private readonly logger = new Logger(AppointmentCalendarService.name);

  constructor(
    @InjectRepository(CalendarIntegration)
    private readonly calendarIntegrationRepository: Repository<CalendarIntegration>,
    private readonly calendarService: CalendarService,
  ) {}

  async syncAppointmentToCalendar(appointment: Appointment): Promise<void> {
    try {
      // Get calendar integrations for doctor
      const doctorIntegrations = await this.calendarIntegrationRepository.find({
        where: { 
          user: { id: appointment.doctor.user.id } as any,
          isActive: true,
          syncEnabled: true,
        },
      });

      // Get calendar integrations for patient
      const patientIntegrations = await this.calendarIntegrationRepository.find({
        where: { 
          user: { id: appointment.patient.user.id } as any,
          isActive: true,
          syncEnabled: true,
        },
      });

      const calendarEventDto = this.createCalendarEventFromAppointment(appointment);

      // Sync to doctor's calendars
      for (const integration of doctorIntegrations) {
        try {
          const eventId = await this.calendarService.createCalendarEvent(
            integration.id,
            calendarEventDto,
          );
          
          // Store the external event ID for future updates/deletes
          appointment.externalCalendarIds = appointment.externalCalendarIds || {};
          appointment.externalCalendarIds[integration.id] = eventId;
          
          this.logger.log(`Appointment ${appointment.id} synced to doctor's calendar ${integration.id}`);
        } catch (error) {
          this.logger.error(`Failed to sync appointment to doctor's calendar ${integration.id}: ${error.message}`);
        }
      }

      // Sync to patient's calendars
      for (const integration of patientIntegrations) {
        try {
          const eventId = await this.calendarService.createCalendarEvent(
            integration.id,
            calendarEventDto,
          );
          
          appointment.externalCalendarIds = appointment.externalCalendarIds || {};
          appointment.externalCalendarIds[integration.id] = eventId;
          
          this.logger.log(`Appointment ${appointment.id} synced to patient's calendar ${integration.id}`);
        } catch (error) {
          this.logger.error(`Failed to sync appointment to patient's calendar ${integration.id}: ${error.message}`);
        }
      }

    } catch (error) {
      this.logger.error(`Failed to sync appointment ${appointment.id} to calendars: ${error.message}`, error.stack);
      throw error;
    }
  }

  async updateAppointmentInCalendar(appointment: Appointment): Promise<void> {
    if (!appointment.externalCalendarIds) {
      return; // No calendar events to update
    }

    const calendarEventDto = this.createCalendarEventFromAppointment(appointment);

    for (const [integrationId, eventId] of Object.entries(appointment.externalCalendarIds)) {
      try {
        await this.calendarService.updateCalendarEvent(
          integrationId,
          eventId,
          calendarEventDto,
        );
        
        this.logger.log(`Updated appointment ${appointment.id} in calendar ${integrationId}`);
      } catch (error) {
        this.logger.error(`Failed to update appointment in calendar ${integrationId}: ${error.message}`);
      }
    }
  }

  async removeAppointmentFromCalendar(appointment: Appointment): Promise<void> {
    if (!appointment.externalCalendarIds) {
      return; // No calendar events to remove
    }

    for (const [integrationId, eventId] of Object.entries(appointment.externalCalendarIds)) {
      try {
        await this.calendarService.deleteCalendarEvent(integrationId, eventId);
        this.logger.log(`Removed appointment ${appointment.id} from calendar ${integrationId}`);
      } catch (error) {
        this.logger.error(`Failed to remove appointment from calendar ${integrationId}: ${error.message}`);
      }
    }

    // Clear external calendar IDs
    appointment.externalCalendarIds = {};
  }

  private createCalendarEventFromAppointment(appointment: Appointment): CalendarEventDto {
    const startTime = appointment.appointmentDate.toISOString();
    const endTime = new Date(appointment.appointmentDate.getTime() + appointment.duration * 60000).toISOString();

    const title = `Appointment with ${appointment.patient.firstName} ${appointment.patient.lastName}`;
    const description = this.createAppointmentDescription(appointment);
    const location = appointment.consultationType === 'IN_PERSON' 
      ? appointment.doctor.clinicAddress 
      : 'Virtual Consultation';

    return {
      title,
      description,
      startTime,
      endTime,
      location,
      attendees: [appointment.patient.user.email, appointment.doctor.user.email].join(','),
    };
  }

  private createAppointmentDescription(appointment: Appointment): string {
    const lines = [
      `Appointment Details:`,
      `Patient: ${appointment.patient.firstName} ${appointment.patient.lastName}`,
      `Doctor: Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`,
      `Type: ${appointment.consultationType}`,
      `Status: ${appointment.status}`,
      `Duration: ${appointment.duration} minutes`,
    ];

    if (appointment.notes) {
      lines.push(`Notes: ${appointment.notes}`);
    }

    if (appointment.consultationType === 'VIRTUAL') {
      lines.push(`Meeting Link: ${appointment.meetingLink || 'To be provided'}`);
    }

    return lines.join('\n');
  }

  async getUserCalendarEvents(userId: string, startDate: Date, endDate: Date): Promise<any[]> {
    const integrations = await this.calendarIntegrationRepository.find({
      where: { 
        user: { id: userId } as any,
        isActive: true,
        syncEnabled: true,
      },
    });

    const allEvents = [];

    for (const integration of integrations) {
      try {
        await this.calendarService.syncCalendar({
          calendarIntegrationId: integration.id,
          syncType: 'incremental',
        });

        // Note: You would need to implement getCalendarEvents in CalendarService
        // const events = await this.calendarService.getCalendarEvents(integration.id, startDate, endDate);
        // allEvents.push(...events);

      } catch (error) {
        this.logger.error(`Failed to get events from calendar ${integration.id}: ${error.message}`);
      }
    }

    return allEvents;
  }

  async checkCalendarConflicts(userId: Date, startTime: Date, endTime: Date): Promise<boolean> {
    const events = await this.getUserCalendarEvents(userId, startTime, endTime);
    
    return events.some(event => {
      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);
      
      return (
        (startTime >= eventStart && startTime < eventEnd) ||
        (endTime > eventStart && endTime <= eventEnd) ||
        (startTime <= eventStart && endTime >= eventEnd)
      );
    });
  }
}
