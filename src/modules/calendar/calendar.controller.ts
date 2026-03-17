import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  Redirect,
} from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { CreateCalendarIntegrationDto, UpdateCalendarIntegrationDto, SyncCalendarDto, CalendarEventDto } from './dto/calendar-integration.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CalendarIntegration } from './schema/calendar-integration.entity';

@Controller('calendar')
@UseGuards(JwtAuthGuard)
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Post('integrations')
  async createIntegration(
    @Request() req,
    @Body(ValidationPipe) createCalendarIntegrationDto: CreateCalendarIntegrationDto,
  ): Promise<CalendarIntegration> {
    return await this.calendarService.createCalendarIntegration(req.user.id, createCalendarIntegrationDto);
  }

  @Get('integrations')
  async getUserIntegrations(@Request() req): Promise<CalendarIntegration[]> {
    return await this.calendarService.getUserCalendarIntegrations(req.user.id);
  }

  @Put('integrations/:id')
  async updateIntegration(
    @Param('id') id: string,
    @Body(ValidationPipe) updateCalendarIntegrationDto: UpdateCalendarIntegrationDto,
  ): Promise<CalendarIntegration> {
    return await this.calendarService.updateCalendarIntegration(id, updateCalendarIntegrationDto);
  }

  @Delete('integrations/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteIntegration(@Param('id') id: string): Promise<void> {
    await this.calendarService.deleteCalendarIntegration(id);
  }

  @Post('sync')
  @HttpCode(HttpStatus.OK)
  async syncCalendar(@Body(ValidationPipe) syncCalendarDto: SyncCalendarDto): Promise<void> {
    await this.calendarService.syncCalendar(syncCalendarDto);
  }

  @Post('events')
  async createEvent(
    @Query('integrationId') integrationId: string,
    @Body(ValidationPipe) calendarEventDto: CalendarEventDto,
  ): Promise<{ eventId: string }> {
    const eventId = await this.calendarService.createCalendarEvent(integrationId, calendarEventDto);
    return { eventId };
  }

  @Put('events/:eventId')
  @HttpCode(HttpStatus.OK)
  async updateEvent(
    @Query('integrationId') integrationId: string,
    @Param('eventId') eventId: string,
    @Body(ValidationPipe) calendarEventDto: CalendarEventDto,
  ): Promise<void> {
    await this.calendarService.updateCalendarEvent(integrationId, eventId, calendarEventDto);
  }

  @Delete('events/:eventId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteEvent(
    @Query('integrationId') integrationId: string,
    @Param('eventId') eventId: string,
  ): Promise<void> {
    await this.calendarService.deleteCalendarEvent(integrationId, eventId);
  }

  @Get('google/auth')
  async getGoogleAuthUrl(@Request() req): Promise<{ authUrl: string }> {
    const authUrl = await this.calendarService.getGoogleAuthUrl(req.user.id);
    return { authUrl };
  }

  @Get('google/callback')
  @Redirect()
  async handleGoogleCallback(
    @Query('code') code: string,
    @Query('state') userId: string,
  ): Promise<{ url: string }> {
    await this.calendarService.handleGoogleCallback(code, userId);
    return { url: `${process.env.FRONTEND_URL}/calendar/success` };
  }
}
