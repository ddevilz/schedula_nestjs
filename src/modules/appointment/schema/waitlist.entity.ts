import { Doctor } from '../../doctors/schemas/doctors.entity';
import { Patient } from '../../patient/schema/patient.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Waitlist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Patient)
  patient: Patient;

  @ManyToOne(() => Doctor, (doctor) => doctor.waitlistEntries)
  doctor: Doctor;

  @Column()
  preferredDate: Date;

  @Column()
  reason: string;

  @CreateDateColumn()
  createdAt: Date;
}
