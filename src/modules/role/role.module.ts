import { Module } from '@nestjs/common';
import { RoleService } from './role.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './schema/roles.entity';
import { User } from '../users/schemas/user.entity';
import { Permission } from './schema/permission.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Role, User, Permission])],
  providers: [RoleService],
})
export class RoleModule {}
