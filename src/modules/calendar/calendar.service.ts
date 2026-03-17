import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { CalendarIntegration, CalendarProvider } from './schema/calendar-integration.entity';
import { CreateCalendarIntegrationDto, UpdateCalendarIntegrationDto, SyncCalendarDto, CalendarEventDto } from './dto/calendar-integration.dto';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);
  private googleOAuth2Client: OAuth2Client;

  constructor(
    @InjectRepository(CalendarIntegration)
    private readonly calendarIntegrationRepository: Repository<CalendarIntegration>,
    private readonly configService: ConfigService,
  ) {
    this.initializeGoogleClient();
  }

  private initializeGoogleClient() {
    this.googleOAuth2Client = new google.auth.OAuth2(
      this.configService.get('GOOGLE_CLIENT_ID'),
      this.configService.get('GOOGLE_CLIENT_SECRET'),
      this.configService.get('GOOGLE_REDIRECT_URI'),
    );
  }

  async createCalendarIntegration(
    userId: string,
    createCalendarIntegrationDto: CreateCalendarIntegrationDto,
  ): Promise<CalendarIntegration> {
    const integration = this.calendarIntegrationRepository.create({
      ...createCalendarIntegrationDto,
      user: { id: userId } as any,
    });

    return await this.calendarIntegrationRepository.save(integration);
  }

  async getUserCalendarIntegrations(userId: string): Promise<CalendarIntegration[]> {
    return await this.calendarIntegrationRepository.find({
      where: { user: { id: userId } as any },
      order: { createdAt: 'DESC' },
    });
  }

  async updateCalendarIntegration(
    integrationId: string,
    updateCalendarIntegrationDto: UpdateCalendarIntegrationDto,
  ): Promise<CalendarIntegration> {
    const integration = await this.calendarIntegrationRepository.findOne({
      where: { id: integrationId },
    });

    if (!integration) {
      throw new NotFoundException('Calendar integration not found');
    }

    Object.assign(integration, updateCalendarIntegrationDto);
    return await this.calendarIntegrationRepository.save(integration);
  }

  async deleteCalendarIntegration(integrationId: string): Promise<void> {
    const result = await this.calendarIntegrationRepository.delete(integrationId);
    if (result.affected === 0) {
      throw new NotFoundException('Calendar integration not found');
    }
  }

  async syncCalendar(syncCalendarDto: SyncCalendarDto): Promise<void> {
    const integration = await this.calendarIntegrationRepository.findOne({
      where: { id: syncCalendarDto.calendarIntegrationId },
    });

    if (!integration) {
      throw new NotFoundException('Calendar integration not found');
    }

    if (!integration.syncEnabled) {
      throw new BadRequestException('Calendar sync is disabled');
    }

    try {
      switch (integration.provider) {
        case CalendarProvider.GOOGLE:
          await this.syncGoogleCalendar(integration, syncCalendarDto.syncType);
          break;
        default:
          throw new BadRequestException(`Unsupported calendar provider: ${integration.provider}`);
      }

      this.logger.log(`Successfully synced ${integration.provider} calendar for integration ${integration.id}`);
    } catch (error) {
      this.logger.error(`Failed to sync calendar: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async syncGoogleCalendar(integration: CalendarIntegration, syncType: string): Promise<void> {
    this.googleOAuth2Client.setCredentials({
      access_token: integration.accessToken,
      refresh_token: integration.refreshToken,
    });

    const calendar = google.calendar({ version: 'v3', auth: this.googleOAuth2Client });

    try {
      const now = new Date();
      const timeMin = syncType === 'full' 
        ? new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).toISOString()
        : new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).toISOString();
      
      const timeMax = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()).toISOString();

      const response = await calendar.events.list({
        calendarId: integration.calendarId,
        timeMin,
        timeMax,
        singleEvents: true,
        orderBy: 'startTime',
      });

      const events = response.data.items;
      this.logger.log(`Found ${events?.length || 0} events in Google Calendar`);

      // Store sync metadata
      integration.providerData = {
        ...integration.providerData,
        lastSyncAt: new Date().toISOString(),
        lastSyncType: syncType,
        eventsFound: events?.length || 0,
      };

      await this.calendarIntegrationRepository.save(integration);

    } catch (error) {
      if (error.code === 401) {
        // Token expired, try to refresh
        await this.refreshGoogleToken(integration);
        // Retry the sync
        return this.syncGoogleCalendar(integration, syncType);
      }
      throw error;
    }
  }

  private async refreshGoogleToken(integration: CalendarIntegration): Promise<void> {
    try {
      const { credentials } = await this.googleOAuth2Client.refreshAccessToken({
        refresh_token: integration.refreshToken,
      });

      integration.accessToken = credentials.access_token;
      integration.tokenExpiry = new Date(credentials.expiry_date);

      if (credentials.refresh_token) {
        integration.refreshToken = credentials.refresh_token;
      }

      await this.calendarIntegrationRepository.save(integration);
      this.logger.log('Successfully refreshed Google Calendar token');
    } catch (error) {
      this.logger.error('Failed to refresh Google Calendar token', error.stack);
      throw new BadRequestException('Failed to refresh calendar access token');
    }
  }

  async createCalendarEvent(
    integrationId: string,
    calendarEventDto: CalendarEventDto,
  ): Promise<string> {
    const integration = await this.calendarIntegrationRepository.findOne({
      where: { id: integrationId },
    });

    if (!integration) {
      throw new NotFoundException('Calendar integration not found');
    }

    switch (integration.provider) {
      case CalendarProvider.GOOGLE:
        return await this.createGoogleCalendarEvent(integration, calendarEventDto);
      default:
        throw new BadRequestException(`Unsupported calendar provider: ${integration.provider}`);
    }
  }

  private async createGoogleCalendarEvent(
    integration: CalendarIntegration,
    calendarEventDto: CalendarEventDto,
  ): Promise<string> {
    this.googleOAuth2Client.setCredentials({
      access_token: integration.accessToken,
      refresh_token: integration.refreshToken,
    });

    const calendar = google.calendar({ version: 'v3', auth: this.googleOAuth2Client });

    const event = {
      summary: calendarEventDto.title,
      description: calendarEventDto.description,
      start: {
        dateTime: calendarEventDto.startTime,
        timeZone: 'UTC',
      },
      end: {
        dateTime: calendarEventDto.endTime,
        timeZone: 'UTC',
      },
      location: calendarEventDto.location,
      attendees: calendarEventDto.attendees ? calendarEventDto.attendees.split(',').map(email => ({ email })) : [],
    };

    try {
      const response = await calendar.events.insert({
        calendarId: integration.calendarId,
        requestBody: event,
      });

      const eventId = response.data.id;
      this.logger.log(`Created Google Calendar event: ${eventId}`);
      return eventId;
    } catch (error) {
      if (error.code === 401) {
        await this.refreshGoogleToken(integration);
        return this.createGoogleCalendarEvent(integration, calendarEventDto);
      }
      throw error;
    }
  }

  async updateCalendarEvent(
    integrationId: string,
    eventId: string,
    calendarEventDto: CalendarEventDto,
  ): Promise<void> {
    const integration = await this.calendarIntegrationRepository.findOne({
      where: { id: integrationId },
    });

    if (!integration) {
      throw new NotFoundException('Calendar integration not found');
    }

    switch (integration.provider) {
      case CalendarProvider.GOOGLE:
        await this.updateGoogleCalendarEvent(integration, eventId, calendarEventDto);
        break;
      default:
        throw new BadRequestException(`Unsupported calendar provider: ${integration.provider}`);
    }
  }

  private async updateGoogleCalendarEvent(
    integration: CalendarIntegration,
    eventId: string,
    calendarEventDto: CalendarEventDto,
  ): Promise<void> {
    this.googleOAuth2Client.setCredentials({
      access_token: integration.accessToken,
      refresh_token: integration.refreshToken,
    });

    const calendar = google.calendar({ version: 'v3', auth: this.googleOAuth2Client });

    const event = {
      summary: calendarEventDto.title,
      description: calendarEventDto.description,
      start: {
        dateTime: calendarEventDto.startTime,
        timeZone: 'UTC',
      },
      end: {
        dateTime: calendarEventDto.endTime,
        timeZone: 'UTC',
      },
      location: calendarEventDto.location,
    };

    try {
      await calendar.events.update({
        calendarId: integration.calendarId,
        eventId,
        requestBody: event,
      });

      this.logger.log(`Updated Google Calendar event: ${eventId}`);
    } catch (error) {
      if (error.code === 401) {
        await this.refreshGoogleToken(integration);
        return this.updateGoogleCalendarEvent(integration, eventId, calendarEventDto);
      }
      throw error;
    }
  }

  async deleteCalendarEvent(integrationId: string, eventId: string): Promise<void> {
    const integration = await this.calendarIntegrationRepository.findOne({
      where: { id: integrationId },
    });

    if (!integration) {
      throw new NotFoundException('Calendar integration not found');
    }

    switch (integration.provider) {
      case CalendarProvider.GOOGLE:
        await this.deleteGoogleCalendarEvent(integration, eventId);
        break;
      default:
        throw new BadRequestException(`Unsupported calendar provider: ${integration.provider}`);
    }
  }

  private async deleteGoogleCalendarEvent(integration: CalendarIntegration, eventId: string): Promise<void> {
    this.googleOAuth2Client.setCredentials({
      access_token: integration.accessToken,
      refresh_token: integration.refreshToken,
    });

    const calendar = google.calendar({ version: 'v3', auth: this.googleOAuth2Client });

    try {
      await calendar.events.delete({
        calendarId: integration.calendarId,
        eventId,
      });

      this.logger.log(`Deleted Google Calendar event: ${eventId}`);
    } catch (error) {
      if (error.code === 401) {
        await this.refreshGoogleToken(integration);
        return this.deleteGoogleCalendarEvent(integration, eventId);
      }
      throw error;
    }
  }

  async getGoogleAuthUrl(userId: string): Promise<string> {
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
    ];

    const url = this.googleOAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: userId, // Pass user ID for callback handling
      prompt: 'consent',
    });

    return url;
  }

  async handleGoogleCallback(code: string, userId: string): Promise<CalendarIntegration> {
    try {
      const { tokens } = await this.googleOAuth2Client.getToken(code);
      this.googleOAuth2Client.setCredentials(tokens);

      // Get user's calendar list
      const calendar = google.calendar({ version: 'v3', auth: this.googleOAuth2Client });
      const calendarList = await calendar.calendarList.list();
      const primaryCalendar = calendarList.data.items?.find(cal => cal.primary);

      if (!primaryCalendar) {
        throw new BadRequestException('No primary calendar found');
      }

      // Check if integration already exists
      const existingIntegration = await this.calendarIntegrationRepository.findOne({
        where: {
          user: { id: userId } as any,
          provider: CalendarProvider.GOOGLE,
          calendarId: primaryCalendar.id,
        },
      });

      if (existingIntegration) {
        // Update existing integration
        existingIntegration.accessToken = tokens.access_token;
        existingIntegration.refreshToken = tokens.refresh_token || existingIntegration.refreshToken;
        existingIntegration.tokenExpiry = new Date(tokens.expiry_date);
        existingIntegration.email = tokens.email;
        existingIntegration.isActive = true;

        return await this.calendarIntegrationRepository.save(existingIntegration);
      } else {
        // Create new integration
        const createDto: CreateCalendarIntegrationDto = {
          provider: CalendarProvider.GOOGLE,
          calendarId: primaryCalendar.id,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          email: tokens.email,
          syncEnabled: true,
        };

        return await this.createCalendarIntegration(userId, createDto);
      }
    } catch (error) {
      this.logger.error('Google OAuth callback failed', error.stack);
      throw new BadRequestException('Failed to authenticate with Google Calendar');
    }
  }
}
