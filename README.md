# Schedulla - Appointment Scheduling System

## Overview

Schedulla is an appointment scheduling system built using the NestJS framework. It allows users, doctors, and patients to efficiently manage appointments, schedules, and cancellations. The system includes role-based authentication, scheduling management, and modular architecture for scalability. It also uses Rollbar for error tracking and TypeORM for database management.

## Features

- **User Authentication**: JWT-based authentication system for secure access.
- **Role Management**: Distinct roles for users, doctors, and patients.
- **Doctor Scheduling**: Manage doctor availability,

schedules, and consultation times.

- **Appointment Management**: Create, update, cancel, or reschedule appointments.
- **Patient Management**: Manage patient data and their interaction with appointments.
- **Multi-Tenant Support**: Separate data management for different tenants (organizations or clinics).
- **Error Tracking**: Integrated with Rollbar for real-time error monitoring.
- **Database Integration**: TypeORM for handling database interactions.

## Technologies

- **NestJS**: A progressive Node.js framework for building efficient server-side applications.
- **TypeORM**: An ORM to interact with databases.
- **JWT**: JSON Web Token for secure authentication.
- **Rollbar**: For error tracking and monitoring.
- **Cron Jobs**: Automates the scheduling process by generating schedules weekly.

## Modules

- **UsersModule**: Handles user registration and profile management.
- **AuthModule**: Manages authentication and role-based access control using JWT.
- **DoctorsModule**: Manages doctor-related functionalities, including scheduling and availability.
- **PatientModule**: Manages patient-related data and appointment bookings.
- **AppointmentModule**: Handles appointment creation, modification, rescheduling, and cancellation.
- **TenantModule**: Provides multi-tenant support for managing different clinics or organizations.
- **RoleModule**: Manages user roles and permissions.

## Getting Started

### Prerequisites

- Node.js v14+
- npm or yarn
- PostgreSQL (for database)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/ddevilz/schedula_nestjs.git
   cd schedula
   ```

2. Install dependencies:

   ```bash
   yarn install
   ```

3. Configure environment variables:

   Create a `.env` file based on `.env.example` and update the necessary values (database connection, JWT secret, Rollbar token, etc.).

4. Run database migrations:

   ```bash
   npm run migration:run
   ```

### Running the Application

1. Start the development server:

   ```bash
   npm run start:dev
   ```

2. The application should now be running at `http://localhost:3000`.

## Contributing

Feel free to contribute to the project. Fork the repository, make your changes, and create a pull request.

## License

This project is licensed under the MIT License.
