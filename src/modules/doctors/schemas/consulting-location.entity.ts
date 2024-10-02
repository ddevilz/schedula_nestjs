import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Organization } from './organization.entity';
import { Tenant } from 'src/modules/tenant/schema/tenant.entity';
import { Doctor } from './doctors.entity';

@Entity()
export class ConsultingLocation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  address: string;

  @Column()
  city: string;

  @Column()
  state: string;

  @Column()
  country: string;

  @Column()
  zipCode: string;

  @ManyToOne(
    () => Organization,
    (organization) => organization.consultingLocations,
  )
  organization: Organization;

  @ManyToOne(() => Tenant, (tenant) => tenant.consultingLocations)
  tenant: Tenant;

  @OneToMany(() => Doctor, (doctor) => doctor.consultationLocation)
  doctors: Doctor[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
