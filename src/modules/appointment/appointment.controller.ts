import {
  Controller,
  Post,
  Body,
  Param,
  Put,
  Delete,
  NotFoundException,
  HttpException,
  HttpStatus,
  Get,
  Query,
  ValidationPipe,
  Request,
} from '@nestjs/common';
import { AppointmentsService } from './appointment.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { CreateRecurringAppointmentDto } from './dto/create-recurring-appointment.dto';
import { CreateEmergencyAppointmentDto } from './dto/create-emergency-appointment.dto';
import { AddToWaitlistDto } from './dto/add-to-waitlist.dto';
import { Appointment } from './schema/appointment.entity';
import { Waitlist } from './schema/waitlist.entity';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  // @Get('patient/:patientId')
  // async findAppointmentsByPatientId(
  //   @Param('patientId') patientId: string,
  // ): Promise<Appointment[]> {
  //   try {
  //     return await this.appointmentsService.findAppointmentsByPatientId(
  //       patientId,
  //     );
  //   } catch (error) {
  //     this.handleError(error);
  //   }
  // }

  @Post('schedule')
  async scheduleAppointment(
    @Body(ValidationPipe) createAppointmentDto: CreateAppointmentDto,
  ): Promise<Appointment> {
    try {
      return await this.appointmentsService.scheduleAppointment(
        createAppointmentDto,
      );
    } catch (error) {
      this.handleError(error);
    }
  }

  @Put('reschedule/:appointmentId')
  async rescheduleAppointment(
    @Param('appointmentId') appointmentId: string,
    @Body(ValidationPipe) rescheduleAppointmentDto: RescheduleAppointmentDto,
  ): Promise<Appointment> {
    try {
      return await this.appointmentsService.rescheduleAppointment(
        appointmentId,
        new Date(rescheduleAppointmentDto.newDate),
        rescheduleAppointmentDto.newTime,
      );
    } catch (error) {
      this.handleError(error);
    }
  }

  @Put(':id/cancel-by-doctor')
  async cancelAppointmentByDoctor(
    @Param('id') id: string,
    reason: string,
  ): Promise<void> {
    try {
      await this.appointmentsService.cancelAppointmentByDoctor(id, reason);
    } catch (error) {
      this.handleError(error);
    }
  }

  @Put(':id/cancel-by-patient')
  async cancelAppointmentByPatient(
    @Param('id') id: string,
    reason: string,
  ): Promise<void> {
    try {
      await this.appointmentsService.cancelAppointmentByPatient(id, reason);
    } catch (error) {
      this.handleError(error);
    }
  }

  @Put('reschedule-doctor-appointments')
  async rescheduleDoctorAppointments(
    @Query('doctorId') doctorId: string,
    @Query('oldDate') oldDate: string,
    @Query('newDate') newDate: string,
    @Query('timeOffset') timeOffset: number,
  ): Promise<void> {
    try {
      await this.appointmentsService.rescheduleDoctorAppointments(
        doctorId,
        new Date(oldDate),
        new Date(newDate),
        timeOffset,
      );
    } catch (error) {
      this.handleError(error);
    }
  }

  @Get('available-slots')
  async getAvailableSlots(
    @Query('doctorId') doctorId: string,
    @Query('date') date: string,
  ): Promise<any[]> {
    try {
      return await this.appointmentsService.getAvailableSlots(
        doctorId,
        new Date(date),
      );
    } catch (error) {
      this.handleError(error);
    }
  }

  @Post('waitlist')
  async createWaitlistEntry(@Body() createWaitlistEntryDto: AddToWaitlistDto) {
    return this.appointmentsService.addToWaitlist(createWaitlistEntryDto);
  }

  // @Put('reschedule/:appointmentId')
  // async rescheduleAppointment(
  //   @Param('appointmentId') appointmentId: string,
  //   @Body(ValidationPipe) rescheduleAppointmentDto: RescheduleAppointmentDto,
  // ): Promise<Appointment> {
  //   try {
  //     return await this.appointmentsService.rescheduleAppointment(
  //       appointmentId,
  //       new Date(rescheduleAppointmentDto.newDate),
  //       rescheduleAppointmentDto.newTime,
  //     );
  //   } catch (error) {
  //     this.handleError(error);
  //   }
  // }

  // @Delete('cancel/:appointmentId')
  // async cancelAppointment(
  //   @Param('appointmentId') appointmentId: string,
  // ): Promise<Appointment> {
  //   try {
  //     return await this.appointmentsService.cancelAppointment(appointmentId);
  //   } catch (error) {
  //     this.handleError(error);
  //   }
  // }

  // @Post('recurring')
  // async scheduleRecurringAppointment(
  //   @Body(ValidationPipe)
  //   createRecurringAppointmentDto: CreateRecurringAppointmentDto,
  // ): Promise<Appointment[]> {
  //   try {
  //     return await this.appointmentsService.scheduleRecurringAppointment(
  //       createRecurringAppointmentDto.patientId,
  //       createRecurringAppointmentDto.doctorId,
  //       new Date(createRecurringAppointmentDto.startDate),
  //       new Date(createRecurringAppointmentDto.endDate),
  //       createRecurringAppointmentDto.frequency,
  //       createRecurringAppointmentDto.duration,
  //       createRecurringAppointmentDto.reason,
  //       createRecurringAppointmentDto.consultationType,
  //     );
  //   } catch (error) {
  //     this.handleError(error);
  //   }
  // }

  // @Post('emergency')
  // async bookEmergencyAppointment(
  //   @Body(ValidationPipe)
  //   createEmergencyAppointmentDto: CreateEmergencyAppointmentDto,
  // ): Promise<Appointment> {
  //   try {
  //     return await this.appointmentsService.bookEmergencyAppointment(
  //       createEmergencyAppointmentDto.patientId,
  //       createEmergencyAppointmentDto.doctorId,
  //       createEmergencyAppointmentDto.reason,
  //     );
  //   } catch (error) {
  //     this.handleError(error);
  //   }
  // }

  // @Post('waitlist')
  // async addToWaitlist(
  //   @Body(ValidationPipe) addToWaitlistDto: AddToWaitlistDto,
  // ): Promise<Waitlist> {
  //   try {
  //     return await this.appointmentsService.addToWaitlist(
  //       addToWaitlistDto.patientId,
  //       addToWaitlistDto.doctorId,
  //       new Date(addToWaitlistDto.preferredDate),
  //       addToWaitlistDto.reason,
  //     );
  //   } catch (error) {
  //     this.handleError(error);
  //   }
  // }

  // @Get('doctor/:doctorId/upcoming')
  // async getUpcomingAppointments(
  //   @Param('doctorId') doctorId: string,
  //   @Query('startDate') startDate: string,
  //   @Query('endDate') endDate: string,
  // ): Promise<Appointment[]> {
  //   try {
  //     return await this.appointmentsService.getUpcomingAppointments(
  //       doctorId,
  //       new Date(startDate),
  //       new Date(endDate),
  //     );
  //   } catch (error) {
  //     this.handleError(error);
  //   }
  // }

  // @Get('doctor/:doctorId/availability')
  // async getDoctorAvailability(
  //   @Param('doctorId') doctorId: string,
  //   @Query('startDate') startDate: string,
  //   @Query('endDate') endDate: string,
  // ): Promise<any[]> {
  //   try {
  //     return await this.appointmentsService.getDoctorAvailability(
  //       doctorId,
  //       new Date(startDate),
  //       new Date(endDate),
  //     );
  //   } catch (error) {
  //     this.handleError(error);
  //   }
  // }

  private handleError(error: any) {
    if (error instanceof NotFoundException) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    } else if (error instanceof HttpException) {
      throw error;
    } else {
      throw new HttpException(
        'An unexpected error occurred',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
