// src/doctor/doctor.enums.ts

export enum ConsultationType {
  ONLINE = 'online',
  OFFLINE = 'offline',
  BOTH = 'both',
}

export enum AvailabilityDay {
  MONDAY = 'Monday',
  TUESDAY = 'Tuesday',
  WEDNESDAY = 'Wednesday',
  THURSDAY = 'Thursday',
  FRIDAY = 'Friday',
  SATURDAY = 'Saturday',
  SUNDAY = 'Sunday',
}

export enum DoctorStatus {
  VERIFIED = 'verified',
  UNVERIFIED = 'unverified',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}
