export type EnvVarType = 'string' | 'number' | 'boolean';

export interface EnvVarConfig {
  required: boolean;
  type: EnvVarType;
  default?: any;
  validator?: (value: any) => boolean;
}

export interface EnvValidationResult {
  isValid: boolean;
  errors: string[];
  values: Record<string, any>;
}

export interface IEnvValidator {
  validate(schema: Record<string, EnvVarConfig>): EnvValidationResult;
  get(key: string): any;
  getNumber(key: string): number;
  getBoolean(key: string): boolean;
}
