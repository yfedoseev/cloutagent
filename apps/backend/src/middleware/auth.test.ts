import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest, Project } from '@cloutagent/types';
import { API_KEY_HEADER } from '@cloutagent/types';
import { AuthMiddleware } from './auth';

// Mock ProjectStorage
class MockProjectStorage {
  getAllProjects = vi.fn();
}

describe('AuthMiddleware', () => {
  let authMiddleware: AuthMiddleware;
  let mockProjectStorage: MockProjectStorage;
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockProjectStorage = new MockProjectStorage();
    authMiddleware = new AuthMiddleware(mockProjectStorage as any);

    mockRequest = {
      headers: {},
    };

    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    mockNext = vi.fn();
  });

  describe('generateAPIKey', () => {
    it('should generate API key with 32 characters', () => {
      const apiKey = authMiddleware.generateAPIKey();
      expect(apiKey).toHaveLength(64); // 32 bytes = 64 hex chars
      expect(apiKey).toMatch(/^[a-f0-9]+$/);
    });

    it('should generate unique API keys', () => {
      const key1 = authMiddleware.generateAPIKey();
      const key2 = authMiddleware.generateAPIKey();
      expect(key1).not.toBe(key2);
    });
  });

  describe('hashAPIKey', () => {
    it('should hash API key using bcrypt', async () => {
      const apiKey = 'test-api-key-12345';
      const hash = await authMiddleware.hashAPIKey(apiKey);

      expect(hash).toBeTruthy();
      expect(hash).toMatch(/^\$2[aby]\$/); // bcrypt hash pattern
      expect(hash).not.toBe(apiKey);
    });

    it('should generate different hashes for same key', async () => {
      const apiKey = 'test-api-key-12345';
      const hash1 = await authMiddleware.hashAPIKey(apiKey);
      const hash2 = await authMiddleware.hashAPIKey(apiKey);

      expect(hash1).not.toBe(hash2); // bcrypt uses salt
    });
  });

  describe('validateAPIKey', () => {
    it('should validate correct API key', async () => {
      const apiKey = 'test-api-key';
      const hash = await authMiddleware.hashAPIKey(apiKey);

      const mockProject: Project = {
        id: 'proj-001',
        name: 'Test Project',
        apiKey: hash,
        agent: {} as any,
        subagents: [],
        hooks: [],
        mcps: [],
        limits: { maxTokens: 1000000, maxCost: 100, timeout: 300000 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockProjectStorage.getAllProjects.mockResolvedValue([mockProject]);

      const result = await authMiddleware.validateAPIKey(apiKey);
      expect(result).toEqual(mockProject);
    });

    it('should reject invalid API key', async () => {
      mockProjectStorage.getAllProjects.mockResolvedValue([]);

      const result = await authMiddleware.validateAPIKey('invalid-key');
      expect(result).toBeNull();
    });

    it('should reject wrong password for existing project', async () => {
      const correctKey = 'correct-key';
      const wrongKey = 'wrong-key';
      const hash = await authMiddleware.hashAPIKey(correctKey);

      const mockProject: Project = {
        id: 'proj-001',
        name: 'Test Project',
        apiKey: hash,
        agent: {} as any,
        subagents: [],
        hooks: [],
        mcps: [],
        limits: { maxTokens: 1000000, maxCost: 100, timeout: 300000 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockProjectStorage.getAllProjects.mockResolvedValue([mockProject]);

      const validResult = await authMiddleware.validateAPIKey(correctKey);
      expect(validResult).toEqual(mockProject);

      const invalidResult = await authMiddleware.validateAPIKey(wrongKey);
      expect(invalidResult).toBeNull();
    });
  });

  describe('middleware', () => {
    it('should reject missing API key header', async () => {
      await authMiddleware.middleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'UNAUTHORIZED',
          message: 'API key is required',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject invalid API key', async () => {
      mockRequest.headers = { [API_KEY_HEADER.toLowerCase()]: 'invalid-key' };
      mockProjectStorage.getAllProjects.mockResolvedValue([]);

      await authMiddleware.middleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid API key',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should attach project to request on success', async () => {
      const apiKey = 'valid-key';
      const hash = await authMiddleware.hashAPIKey(apiKey);

      const mockProject: Project = {
        id: 'proj-001',
        name: 'Test Project',
        apiKey: hash,
        agent: {} as any,
        subagents: [],
        hooks: [],
        mcps: [],
        limits: { maxTokens: 1000000, maxCost: 100, timeout: 300000 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockRequest.headers = { [API_KEY_HEADER.toLowerCase()]: apiKey };
      mockProjectStorage.getAllProjects.mockResolvedValue([mockProject]);

      await authMiddleware.middleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext,
      );

      expect(mockRequest.project).toEqual(mockProject);
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });
});
