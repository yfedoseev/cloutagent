import type {
  IEnvValidator,
  EnvVarConfig,
  EnvValidationResult,
  EnvVarType,
} from '@cloutagent/types';

export class EnvValidator implements IEnvValidator {
  private values: Record<string, any> = {};

  validate(schema: Record<string, EnvVarConfig>): EnvValidationResult {
    const errors: string[] = [];
    const values: Record<string, any> = {};

    for (const [key, config] of Object.entries(schema)) {
      const rawValue = process.env[key];

      // Check if required
      if (config.required && !rawValue) {
        errors.push(`${key} is required but not set`);
        continue;
      }

      // Use default if not set
      if (!rawValue && config.default !== undefined) {
        values[key] = config.default;
        continue;
      }

      // Skip if optional and not set
      if (!rawValue) {
        continue;
      }

      // Type conversion
      const convertedValue = this.convertType(rawValue, config.type);

      if (convertedValue === null) {
        errors.push(`${key} must be a valid ${config.type}`);
        continue;
      }

      // Custom validation
      if (config.validator && !config.validator(convertedValue)) {
        errors.push(`${key} failed custom validation`);
        continue;
      }

      values[key] = convertedValue;
    }

    // Store values for getter methods
    this.values = values;

    return {
      isValid: errors.length === 0,
      errors,
      values,
    };
  }

  private convertType(value: string, type: EnvVarType): any {
    switch (type) {
      case 'string':
        return value;

      case 'number': {
        const num = Number(value);
        return isNaN(num) ? null : num;
      }

      case 'boolean': {
        const lower = value.toLowerCase();
        if (lower === 'true' || lower === '1') return true;
        if (lower === 'false' || lower === '0') return false;
        return null;
      }

      default:
        return null;
    }
  }

  get(key: string): any {
    return this.values[key];
  }

  getNumber(key: string): number {
    return this.values[key] as number;
  }

  getBoolean(key: string): boolean {
    return this.values[key] as boolean;
  }
}
