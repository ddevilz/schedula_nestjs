import { Appointment } from 'src/modules/appointment/schema/appointment.entity';
import { ConsultingLocation } from 'src/modules/doctors/schemas/consulting-location.entity';
import { Doctor } from 'src/modules/doctors/schemas/doctors.entity';
import { Organization } from 'src/modules/doctors/schemas/organization.entity';
import { Patient } from 'src/modules/patient/schema/patient.entity';
import { Role } from 'src/modules/role/schema/roles.entity';
import { User } from 'src/modules/users/schemas/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ unique: true, nullable: true })
  domain: string;

  @OneToMany(() => User, (user) => user.tenant)
  users: User[];

  @OneToMany(() => Organization, (organization) => organization.tenant)
  organizations: Organization[];

  @OneToMany(() => ConsultingLocation, (location) => location.tenant)
  consultingLocations: ConsultingLocation[];

  @OneToMany(() => Role, (role) => role.tenant)
  roles: Role[];

  @OneToMany(() => Doctor, (doctor) => doctor.tenant)
  doctors: Doctor[];

  @OneToMany(() => Patient, (patient) => patient.tenant)
  patients: Patient[];

  @OneToMany(() => Appointment, (appointment) => appointment.tenant)
  appointments: Appointment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
