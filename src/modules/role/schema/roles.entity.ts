import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  ManyToOne,
  JoinTable,
  UpdateDateColumn,
  CreateDateColumn,
} from 'typeorm';
import { Tenant } from '../../tenant/schema/tenant.entity';
import { Organization } from '../../doctors/schemas/organization.entity';
import { Permission } from './permission.entity';
import { User } from '../../users/schemas/user.entity';

@Entity()
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @ManyToMany(() => Permission, { eager: true })
  @JoinTable()
  permissions: Permission[];

  @ManyToOne(() => Tenant, (tenant) => tenant.roles)
  tenant: Tenant;

  @ManyToOne(() => Organization, (organization) => organization.roles, {
    nullable: true,
  })
  organization: Organization;

  @ManyToMany(() => User, (user) => user.roles)
  users: User[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
