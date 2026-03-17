import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/schemas/user.entity';

export enum CalendarProvider {
  GOOGLE = 'google',
  OUTLOOK = 'outlook',
  ICAL = 'ical',
}

@Entity('calendar_integrations')
export class CalendarIntegration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: CalendarProvider })
  provider: CalendarProvider;

  @Column()
  calendarId: string;

  @Column()
  accessToken: string;

  @Column()
  refreshToken: string;

  @Column({ nullable: true })
  email: string;

  @Column({ type: 'datetime', nullable: true })
  tokenExpiry: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: true })
  syncEnabled: boolean;

  @Column({ type: 'json', nullable: true })
  providerData: Record<string, any>;

  @ManyToOne(() => User)
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
