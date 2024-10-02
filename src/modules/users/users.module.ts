// users.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { User } from './schemas/user.entity';
import { UsersService } from './users.service';
import { Role } from '../role/schema/roles.entity';
import { Tenant } from '../tenant/schema/tenant.entity';
import { Organization } from '../doctors/schemas/organization.entity';
import { RoleService } from '../role/role.service';
import { Permission } from '../role/schema/permission.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, Tenant, Organization, Permission]),
  ],
  controllers: [UsersController],
  providers: [UsersService, RoleService],
  exports: [UsersService],
})
export class UsersModule {}
