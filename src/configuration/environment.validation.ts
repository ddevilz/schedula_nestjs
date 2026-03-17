import { plainToClass } from 'class-transformer';
import { validateSync } from 'class-validator';
import { IsString, IsNumber, IsOptional, IsNotEmpty } from 'class-validator';

class EnvironmentVariables {
  @IsString()
  @IsNotEmpty()
  JWT_SECRET: string;

  @IsString()
  @IsOptional()
  JWT_EXPIRES_IN: string = '1h';

  @IsString()
  @IsOptional()
  ROLLBAR_ACCESS_TOKEN: string;

  @IsString()
  @IsOptional()
  ROLLBAR_ENVIRONMENT: string;

  @IsString()
  @IsOptional()
  POSTGRES_HOST: string = 'localhost';

  @IsNumber()
  @IsOptional()
  POSTGRES_PORT: number = 5432;

  @IsString()
  @IsOptional()
  POSTGRES_USER: string;

  @IsString()
  @IsOptional()
  POSTGRES_PASSWORD: string;

  @IsString()
  @IsOptional()
  POSTGRES_DATABASE: string;

  @IsNumber()
  @IsOptional()
  PORT: number = 3000;

  @IsString()
  @IsOptional()
  APP_ENV: string = 'development';
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const errorMessages = errors.map(error => {
      const constraints = Object.values(error.constraints || {});
      return `${error.property}: ${constraints.join(', ')}`;
    });
    throw new Error(`Configuration validation error: ${errorMessages.join('; ')}`);
  }

  return validatedConfig;
}
