import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';

import { CreateRoleDto } from './dto/create-role.dto';
import { Role } from './schema/roles.entity';
import { Permission } from './schema/permission.entity';
import { User } from '../users/schemas/user.entity';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  async createRole(createRoleDto: CreateRoleDto): Promise<Role> {
    const { name, tenantId, permissionNames } = createRoleDto;

    const existingRole = await this.roleRepository.findOne({
      where: { name, tenant: { id: tenantId } },
    });
    if (existingRole) {
      throw new ConflictException(
        `Role with name '${name}' already exists for this tenant.`,
      );
    }

    // const permissions = await this.getPermissionsByNames(permissionNames);

    const role = this.roleRepository.create({
      name,
      tenant: { id: tenantId },
      // permissions,
    });

    return this.roleRepository.save(role);
  }

  async getPermissionsByNames(names: string[]): Promise<Permission[]> {
    const permissions = await this.permissionRepository.findBy({
      name: In(names),
    });

    if (permissions.length !== names.length) {
      const foundNames = permissions.map((p) => p.name);
      const missingNames = names.filter((name) => !foundNames.includes(name));
      throw new NotFoundException(
        `Permissions not found: ${missingNames.join(', ')}`,
      );
    }

    return permissions;
  }

  async assignRoleToUser(userId: string, roleId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles'],
    });
    if (!user) {
      throw new NotFoundException(`User with ID '${userId}' not found.`);
    }

    const role = await this.roleRepository.findOne({
      where: { id: roleId },
    });
    if (!role) {
      throw new NotFoundException(`Role with ID '${roleId}' not found.`);
    }

    if (user.roles.some((existingRole) => existingRole.id === roleId)) {
      throw new ConflictException(
        `Role '${role.name}' is already assigned to the user.`,
      );
    }

    user.roles.push(role);

    return this.userRepository.save(user);
  }

  async assignRoleWithTransaction(
    userId: string,
    roleId: string,
  ): Promise<User> {
    return await this.dataSource.transaction(async (manager) => {
      const user = await manager.findOne(User, {
        where: { id: userId },
        relations: ['roles'],
      });
      if (!user) {
        throw new NotFoundException(`User with ID '${userId}' not found.`);
      }

      const role = await manager.findOne(Role, { where: { id: roleId } });
      if (!role) {
        throw new NotFoundException(`Role with ID '${roleId}' not found.`);
      }

      if (user.roles.some((existingRole) => existingRole.id === roleId)) {
        throw new ConflictException(
          `Role '${role.name}' is already assigned to the user.`,
        );
      }

      user.roles.push(role);

      return manager.save(User, user);
    });
  }

  async findRoleByNameAndTenant(name: string, tenantId: string): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { name, tenant: { id: tenantId } },
      relations: ['permissions'],
    });
    if (!role) {
      throw new NotFoundException(
        `Role '${name}' not found for the given tenant.`,
      );
    }
    return role;
  }
}
