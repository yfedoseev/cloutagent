import type { Request } from 'express';
import type { Project } from './index';

export interface IAuthMiddleware {
  validateAPIKey(apiKey: string): Promise<Project | null>;
  generateAPIKey(): string;
  hashAPIKey(apiKey: string): Promise<string>;
}

export interface AuthenticatedRequest extends Request {
  project: Project;
}

export const API_KEY_HEADER = 'X-API-Key';
