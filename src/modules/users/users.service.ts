import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { User } from './schemas/user.entity';
import { RegisterDto } from '../auth/dtos/register.dto';
import { LoginDto } from '../auth/dtos/login.dto';
import * as bcrypt from 'bcrypt';
import { UserInterface } from './interfaces/user.interface';
import { Role } from '../role/schema/roles.entity';
import { Tenant } from '../tenant/schema/tenant.entity';
import { Organization } from '../doctors/schemas/organization.entity';
import { RoleService } from '../role/role.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,

    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,

    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
    private readonly roleService: RoleService,
  ) {}

  // Find user by username
  async findByUsername(username: string): Promise<User | undefined> {
    return this.userRepository.findOne({
      where: { username },
      relations: ['roles', 'tenant'],
    });
  }

  // Find all users, selecting basic info and roles
  async findAll(tenantId: string): Promise<User[]> {
    return await this.userRepository.find({
      where: { tenant: { id: tenantId } },
      select: ['id', 'username', 'email'],
      relations: ['roles'],
    });
  }

  async createUser(registerDto: RegisterDto): Promise<User> {
    const { username, email, password, roleName, organizationId } = registerDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let tenant: Tenant;
    let organization: Organization | null = null;

    if (organizationId) {
      // If organizationId is provided, find the organization and its associated tenant
      organization = await this.organizationRepository.findOne({
        where: { id: organizationId },
        relations: ['tenant'],
      });
      if (!organization) {
        throw new NotFoundException('Invalid organization');
      }
      tenant = organization.tenant;
    } else {
      // If no organizationId, use the common tenant for hospitals
      tenant = await this.tenantRepository.findOne({
        where: { name: 'Common Hospital Tenant' },
      });
      if (!tenant) {
        // If the common tenant doesn't exist, create it
        tenant = this.tenantRepository.create({
          name: 'Common Hospital Tenant',
        });
        await this.tenantRepository.save(tenant);
      }
    }

    // Create or find the role
    let role;
    try {
      // Try to create the role first
      role = await this.roleService.createRole({
        name: roleName,
        tenantId: tenant.id,
      });
    } catch (error) {
      if (error instanceof ConflictException) {
        // If the role already exists, find it
        role = await this.roleService.findRoleByNameAndTenant(
          roleName,
          tenant.id,
        );
      } else {
        throw error;
      }
    }

    // Create the new user
    const newUser = this.userRepository.create({
      username,
      email,
      password: hashedPassword,
      roles: [role],
      tenant,
      organization,
    } as DeepPartial<User>);

    const savedUser = await this.userRepository.save(newUser);

    return savedUser;
  }

  // Validate user on login
  async validateUser(loginDto: LoginDto): Promise<User | null> {
    const { email, password } = loginDto;

    // Find the user with their roles and tenant
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['roles', 'tenant'],
    });

    if (user && bcrypt.compareSync(password, user.password)) {
      return user;
    }
    return null;
  }

  // Find doctors filtered by tenant and role
  async findDoctors(tenantId: string): Promise<User[]> {
    const doctorRole = await this.roleRepository.findOne({
      where: { name: 'doctor', tenant: { id: tenantId } },
    });

    return await this.userRepository.find({
      where: { roles: { id: doctorRole.id }, tenant: { id: tenantId } },
      select: ['id', 'username', 'email'],
    });
  }

  // Find patients filtered by tenant and role
  async findPatients(tenantId: string): Promise<User[]> {
    const patientRole = await this.roleRepository.findOne({
      where: { name: 'patient', tenant: { id: tenantId } },
    });

    return await this.userRepository.find({
      where: { roles: { id: patientRole.id }, tenant: { id: tenantId } },
      select: ['id', 'username', 'email'],
    });
  }
}
