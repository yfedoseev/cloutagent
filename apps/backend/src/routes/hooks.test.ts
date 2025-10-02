import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import { createHookRoutes } from './hooks';
import { HookExecutionService } from '../services/HookExecutionService';
import type { HookConfig, HookExecutionContext } from '@cloutagent/types';

describe('Hook Routes', () => {
  let app: Express;
  let hookService: HookExecutionService;

  beforeEach(() => {
    hookService = new HookExecutionService();
    app = express();
    app.use(express.json());
    app.use('/hooks', createHookRoutes(hookService));
  });

  describe('POST /hooks/validate', () => {
    it('should validate valid hook code', async () => {
      const response = await request(app)
        .post('/hooks/validate')
        .send({
          code: 'return "Hello from hook";',
          type: 'pre-execution',
        })
        .expect(200);

      expect(response.body.valid).toBe(true);
      expect(response.body.errors).toBeUndefined();
    });

    it('should reject code with require()', async () => {
      const response = await request(app)
        .post('/hooks/validate')
        .send({
          code: 'const fs = require("fs");',
          type: 'pre-execution',
        })
        .expect(200);

      expect(response.body.valid).toBe(false);
      expect(response.body.errors).toContain('require() is not allowed');
    });

    it('should reject code with import', async () => {
      const response = await request(app)
        .post('/hooks/validate')
        .send({
          code: 'import fs from "fs";',
          type: 'pre-execution',
        })
        .expect(200);

      expect(response.body.valid).toBe(false);
      expect(response.body.errors).toContain('import statements are not allowed');
    });

    it('should reject code with eval()', async () => {
      const response = await request(app)
        .post('/hooks/validate')
        .send({
          code: 'eval("malicious");',
          type: 'pre-execution',
        })
        .expect(200);

      expect(response.body.valid).toBe(false);
      expect(response.body.errors).toContain('eval() is not allowed');
    });

    it('should reject code with syntax errors', async () => {
      const response = await request(app)
        .post('/hooks/validate')
        .send({
          code: 'const x = ;',
          type: 'pre-execution',
        })
        .expect(200);

      expect(response.body.valid).toBe(false);
      expect(response.body.errors?.[0]).toContain('Syntax error');
    });

    it('should return 400 for missing parameters', async () => {
      const response = await request(app)
        .post('/hooks/validate')
        .send({
          code: 'return "test";',
          // missing type
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /hooks/execute', () => {
    it('should execute a simple hook', async () => {
      const hook: HookConfig = {
        id: 'test-hook',
        name: 'Test Hook',
        type: 'pre-execution',
        enabled: true,
        action: {
          type: 'custom',
          code: 'return "Hello from hook";',
        },
        order: 1,
      };

      const context: HookExecutionContext = {
        hookType: 'pre-execution',
        agentId: 'agent-1',
        projectId: 'project-1',
        timestamp: new Date(),
        payload: {},
        context: {},
      };

      const response = await request(app)
        .post('/hooks/execute')
        .send({ hook, context })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.output).toBe('Hello from hook');
    });

    it('should execute hook with context', async () => {
      const hook: HookConfig = {
        id: 'test-hook',
        name: 'Test Hook',
        type: 'pre-execution',
        enabled: true,
        action: {
          type: 'custom',
          code: 'return { value: context.testValue };',
        },
        order: 1,
      };

      const context: HookExecutionContext = {
        hookType: 'pre-execution',
        agentId: 'agent-1',
        projectId: 'project-1',
        timestamp: new Date(),
        payload: {},
        context: { testValue: 'test' },
      };

      const response = await request(app)
        .post('/hooks/execute')
        .send({ hook, context })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.output).toEqual({ value: 'test' });
    });

    it('should handle hook execution errors', async () => {
      const hook: HookConfig = {
        id: 'test-hook',
        name: 'Test Hook',
        type: 'pre-execution',
        enabled: true,
        action: {
          type: 'custom',
          code: 'throw new Error("Hook error");',
        },
        order: 1,
      };

      const context: HookExecutionContext = {
        hookType: 'pre-execution',
        agentId: 'agent-1',
        projectId: 'project-1',
        timestamp: new Date(),
        payload: {},
        context: {},
      };

      const response = await request(app)
        .post('/hooks/execute')
        .send({ hook, context })
        .expect(200);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 for missing parameters', async () => {
      const response = await request(app)
        .post('/hooks/execute')
        .send({
          hook: {
            id: 'test',
            name: 'Test',
            type: 'pre-execution',
            enabled: true,
            action: { type: 'custom', code: 'return "test";' },
            order: 1,
          },
          // missing context
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });
});
