import { Doctor } from 'src/modules/doctors/schemas/doctors.entity';
import { Patient } from 'src/modules/patient/schema/patient.entity';
import { Role } from 'src/modules/role/schema/roles.entity';
import { Tenant } from 'src/modules/tenant/schema/tenant.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @ManyToOne(() => Tenant, tenant => tenant.users)
  tenant: Tenant;

  @OneToOne(() => Doctor, doctor => doctor.user, { nullable: true })
  doctor: Doctor;

  @OneToOne(() => Patient, patient => patient.user, { nullable: true })
  patient: Patient;

  @ManyToMany(() => Role, role => role.users)
  @JoinTable()
  roles: Role[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
