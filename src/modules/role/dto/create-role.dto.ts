// src/role/dto/create-role.dto.ts

import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsArray,
  ArrayNotEmpty,
  IsOptional,
} from 'class-validator';

export class CreateRoleDto {
  @IsString()
  name: string;

  @IsUUID()
  tenantId: string;

  @IsArray()
  @IsString({ each: true })
  permissionNames?: string[];
}
