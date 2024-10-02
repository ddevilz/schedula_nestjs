import {
  IsEmail,
  IsString,
  IsUUID,
  IsStrongPassword,
  MinLength,
  IsOptional,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(3)
  username: string;

  @IsEmail()
  email: string;

  @IsStrongPassword({ minLength: 8 })
  password: string;

  // Role is now referenced by its UUID
  @IsString()
  roleName: string;

  // Tenant ID for multi-tenant support
  @IsUUID()
  tenantId: string;

  // Optional organization ID if the user belongs to an organization
  @IsUUID()
  @IsOptional()
  organizationId?: string;
}
