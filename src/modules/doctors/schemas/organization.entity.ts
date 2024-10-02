import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ConsultingLocation } from './consulting-location.entity';
import { Tenant } from 'src/modules/tenant/schema/tenant.entity';
import { Doctor } from './doctors.entity';
import { Role } from 'src/modules/role/schema/roles.entity';

@Entity()
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: ['Hospital', 'Clinic', 'Private Practice'],
  })
  type: string;

  @ManyToOne(() => Tenant, (tenant) => tenant.organizations)
  tenant: Tenant;

  @OneToMany(() => Doctor, (doctor) => doctor.organization)
  doctors: Doctor[];

  @OneToMany(() => ConsultingLocation, (location) => location.organization)
  consultingLocations: ConsultingLocation[];

  @OneToMany(() => Role, (role) => role.organization)
  roles: Role[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
