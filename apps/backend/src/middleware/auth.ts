import bcrypt from 'bcrypt';
import crypto from 'crypto';
import type { Response, NextFunction } from 'express';
import type {
  IAuthMiddleware,
  AuthenticatedRequest,
  Project,
} from '@cloutagent/types';

interface ProjectStorage {
  findByApiKey(apiKey: string): Promise<Project | null>;
  getAllProjects(): Promise<Project[]>;
}

export class AuthMiddleware implements IAuthMiddleware {
  private readonly SALT_ROUNDS = 10;

  constructor(private projectStorage: ProjectStorage) {}

  generateAPIKey(): string {
    // Generate 32 random bytes (256 bits) as hex string
    return crypto.randomBytes(32).toString('hex');
  }

  async hashAPIKey(apiKey: string): Promise<string> {
    return bcrypt.hash(apiKey, this.SALT_ROUNDS);
  }

  async validateAPIKey(apiKey: string): Promise<Project | null> {
    // Get all projects and check against hashed API keys
    const projects = await this.projectStorage.getAllProjects();

    for (const project of projects) {
      const isMatch = await bcrypt.compare(apiKey, project.apiKey);
      if (isMatch) {
        return project;
      }
    }

    return null;
  }

  middleware = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'API key is required',
        },
      });
      return;
    }

    const project = await this.validateAPIKey(apiKey);

    if (!project) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid API key',
        },
      });
      return;
    }

    req.project = project;
    next();
  };
}
