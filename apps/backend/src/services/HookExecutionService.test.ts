import { describe, it, expect, beforeEach } from 'vitest';
import { HookExecutionService } from './HookExecutionService';
import type { HookConfig, HookExecutionContext } from '@cloutagent/types';

describe('HookExecutionService', () => {
  let service: HookExecutionService;

  beforeEach(() => {
    service = new HookExecutionService();
  });

  describe('executeHook', () => {
    it('should execute simple hook successfully', async () => {
      const hook: HookConfig = {
        id: 'test-hook-1',
        name: 'Simple Hook',
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

      const result = await service.executeHook(hook, context);

      expect(result.success).toBe(true);
      expect(result.hookId).toBe('test-hook-1');
      expect(result.output).toBe('Hello from hook');
      expect(result.shouldContinue).toBe(true);
    });

    it('should provide context and payload to hook', async () => {
      const hook: HookConfig = {
        id: 'test-hook-2',
        name: 'Context Hook',
        type: 'pre-execution',
        enabled: true,
        action: {
          type: 'custom',
          code: `
            const result = {
              contextValue: context.testValue,
              payloadInput: payload.input
            };
            return result;
          `,
        },
        order: 1,
      };

      const context: HookExecutionContext = {
        hookType: 'pre-execution',
        agentId: 'agent-1',
        projectId: 'project-1',
        timestamp: new Date(),
        payload: { input: 'test input' },
        context: { testValue: 'test context' },
      };

      const result = await service.executeHook(hook, context);

      expect(result.success).toBe(true);
      expect(result.output).toEqual({
        contextValue: 'test context',
        payloadInput: 'test input',
      });
    });

    it('should return hook output', async () => {
      const hook: HookConfig = {
        id: 'test-hook-3',
        name: 'Output Hook',
        type: 'post-execution',
        enabled: true,
        action: {
          type: 'transform',
          code: 'return { modified: true, data: payload.output };',
        },
        order: 1,
      };

      const context: HookExecutionContext = {
        hookType: 'post-execution',
        agentId: 'agent-1',
        projectId: 'project-1',
        timestamp: new Date(),
        payload: { output: 'original output' },
        context: {},
      };

      const result = await service.executeHook(hook, context);

      expect(result.success).toBe(true);
      expect(result.output).toEqual({
        modified: true,
        data: 'original output',
      });
    });

    it('should handle errors gracefully', async () => {
      const hook: HookConfig = {
        id: 'test-hook-4',
        name: 'Error Hook',
        type: 'pre-execution',
        enabled: true,
        action: {
          type: 'custom',
          code: 'throw new Error("Hook execution failed");',
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

      const result = await service.executeHook(hook, context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Hook execution failed');
      expect(result.shouldContinue).toBe(true); // Don't halt workflow
    });

    it('should timeout after 5 seconds', async () => {
      const hook: HookConfig = {
        id: 'test-hook-5',
        name: 'Timeout Hook',
        type: 'pre-execution',
        enabled: true,
        action: {
          type: 'custom',
          code: 'while(true) {}', // Infinite loop
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

      const result = await service.executeHook(hook, context);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should skip disabled hooks', async () => {
      const hook: HookConfig = {
        id: 'test-hook-6',
        name: 'Disabled Hook',
        type: 'pre-execution',
        enabled: false,
        action: {
          type: 'custom',
          code: 'return "Should not run";',
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

      const result = await service.executeHook(hook, context);

      expect(result.success).toBe(true);
      expect(result.output).toBe('Hook disabled, skipped');
    });

    it('should skip hooks with failing conditions', async () => {
      const hook: HookConfig = {
        id: 'test-hook-7',
        name: 'Conditional Hook',
        type: 'pre-execution',
        enabled: true,
        condition: 'context.shouldRun === true',
        action: {
          type: 'custom',
          code: 'return "Hook ran";',
        },
        order: 1,
      };

      const context: HookExecutionContext = {
        hookType: 'pre-execution',
        agentId: 'agent-1',
        projectId: 'project-1',
        timestamp: new Date(),
        payload: {},
        context: { shouldRun: false },
      };

      const result = await service.executeHook(hook, context);

      expect(result.success).toBe(true);
      expect(result.output).toBe('Condition not met, skipped');
    });
  });

  describe('executeHookChain', () => {
    it('should execute multiple hooks in order', async () => {
      const hooks: HookConfig[] = [
        {
          id: 'hook-1',
          name: 'First Hook',
          type: 'pre-execution',
          enabled: true,
          action: {
            type: 'custom',
            code: 'context.step1 = "done"; return "step1";',
          },
          order: 1,
        },
        {
          id: 'hook-2',
          name: 'Second Hook',
          type: 'pre-execution',
          enabled: true,
          action: {
            type: 'custom',
            code: 'context.step2 = "done"; return "step2";',
          },
          order: 2,
        },
      ];

      const context: HookExecutionContext = {
        hookType: 'pre-execution',
        agentId: 'agent-1',
        projectId: 'project-1',
        timestamp: new Date(),
        payload: {},
        context: {},
      };

      const results = await service.executeHookChain(hooks, context);

      expect(results).toHaveLength(2);
      expect(results[0].output).toBe('step1');
      expect(results[1].output).toBe('step2');
    });

    it('should pass modified context between hooks', async () => {
      const hooks: HookConfig[] = [
        {
          id: 'hook-1',
          name: 'Set Value',
          type: 'pre-execution',
          enabled: true,
          action: {
            type: 'custom',
            code: 'context.value = 10; return context.value;',
          },
          order: 1,
        },
        {
          id: 'hook-2',
          name: 'Increment Value',
          type: 'pre-execution',
          enabled: true,
          action: {
            type: 'custom',
            code: 'context.value += 5; return context.value;',
          },
          order: 2,
        },
      ];

      const context: HookExecutionContext = {
        hookType: 'pre-execution',
        agentId: 'agent-1',
        projectId: 'project-1',
        timestamp: new Date(),
        payload: {},
        context: {},
      };

      const results = await service.executeHookChain(hooks, context);

      expect(results[0].output).toBe(10);
      expect(results[1].output).toBe(15);
    });

    it('should stop chain if shouldContinue is false', async () => {
      const hooks: HookConfig[] = [
        {
          id: 'hook-1',
          name: 'Stop Hook',
          type: 'pre-execution',
          enabled: true,
          action: {
            type: 'custom',
            code: 'return { continue: false, message: "Stopping" };',
          },
          order: 1,
        },
        {
          id: 'hook-2',
          name: 'Should Not Run',
          type: 'pre-execution',
          enabled: true,
          action: {
            type: 'custom',
            code: 'return "Should not execute";',
          },
          order: 2,
        },
      ];

      const context: HookExecutionContext = {
        hookType: 'pre-execution',
        agentId: 'agent-1',
        projectId: 'project-1',
        timestamp: new Date(),
        payload: {},
        context: {},
      };

      const results = await service.executeHookChain(hooks, context);

      expect(results).toHaveLength(1);
      expect(results[0].shouldContinue).toBe(false);
    });

    it('should handle errors in chain gracefully', async () => {
      const hooks: HookConfig[] = [
        {
          id: 'hook-1',
          name: 'Good Hook',
          type: 'pre-execution',
          enabled: true,
          action: {
            type: 'custom',
            code: 'return "Success";',
          },
          order: 1,
        },
        {
          id: 'hook-2',
          name: 'Error Hook',
          type: 'pre-execution',
          enabled: true,
          action: {
            type: 'custom',
            code: 'throw new Error("Chain error");',
          },
          order: 2,
        },
        {
          id: 'hook-3',
          name: 'After Error',
          type: 'pre-execution',
          enabled: true,
          action: {
            type: 'custom',
            code: 'return "After error";',
          },
          order: 3,
        },
      ];

      const context: HookExecutionContext = {
        hookType: 'pre-execution',
        agentId: 'agent-1',
        projectId: 'project-1',
        timestamp: new Date(),
        payload: {},
        context: {},
      };

      const results = await service.executeHookChain(hooks, context);

      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[2].success).toBe(true);
    });
  });

  describe('security', () => {
    it('should reject require() calls', async () => {
      const validation = service.validateHookCode(
        'const fs = require("fs");',
        'pre-execution',
      );

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('require() is not allowed');
    });

    it('should reject import statements', async () => {
      const validation = service.validateHookCode(
        'import fs from "fs";',
        'pre-execution',
      );

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('import statements are not allowed');
    });

    it('should reject eval()', async () => {
      const validation = service.validateHookCode(
        'eval("malicious code");',
        'pre-execution',
      );

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('eval() is not allowed');
    });

    it('should reject process access', async () => {
      const validation = service.validateHookCode(
        'process.exit(1);',
        'pre-execution',
      );

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('process access is not allowed');
    });

    it('should reject filesystem access', async () => {
      const validation = service.validateHookCode(
        'const path = __dirname;',
        'pre-execution',
      );

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('filesystem access is not allowed');
    });

    it('should reject network access patterns', async () => {
      const validation = service.validateHookCode(
        'const g = global;',
        'pre-execution',
      );

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('global access is not allowed');
    });
  });

  describe('validateHookCode', () => {
    it('should accept valid JavaScript', async () => {
      const validation = service.validateHookCode(
        'const x = 1; return x + 1;',
        'pre-execution',
      );

      expect(validation.valid).toBe(true);
      expect(validation.errors).toBeUndefined();
    });

    it('should reject code with require()', async () => {
      const validation = service.validateHookCode(
        'require("module")',
        'pre-execution',
      );

      expect(validation.valid).toBe(false);
      expect(validation.errors).toBeDefined();
    });

    it('should reject code with import', async () => {
      const validation = service.validateHookCode(
        'import { something } from "module";',
        'pre-execution',
      );

      expect(validation.valid).toBe(false);
      expect(validation.errors).toBeDefined();
    });

    it('should reject code with eval()', async () => {
      const validation = service.validateHookCode(
        'const result = eval("1+1");',
        'pre-execution',
      );

      expect(validation.valid).toBe(false);
      expect(validation.errors).toBeDefined();
    });

    it('should provide helpful error messages', async () => {
      const validation = service.validateHookCode(
        'const x = ;',
        'pre-execution',
      );

      expect(validation.valid).toBe(false);
      expect(validation.errors?.[0]).toContain('Syntax error');
    });
  });

  describe('condition evaluation', () => {
    it('should evaluate simple conditions', async () => {
      const hook: HookConfig = {
        id: 'cond-hook-1',
        name: 'Conditional',
        type: 'pre-execution',
        enabled: true,
        condition: 'true',
        action: {
          type: 'custom',
          code: 'return "ran";',
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

      const result = await service.executeHook(hook, context);

      expect(result.success).toBe(true);
      expect(result.output).toBe('ran');
    });

    it('should have access to context in conditions', async () => {
      const hook: HookConfig = {
        id: 'cond-hook-2',
        name: 'Conditional',
        type: 'pre-execution',
        enabled: true,
        condition: 'context.enabled === true',
        action: {
          type: 'custom',
          code: 'return "ran with context";',
        },
        order: 1,
      };

      const context: HookExecutionContext = {
        hookType: 'pre-execution',
        agentId: 'agent-1',
        projectId: 'project-1',
        timestamp: new Date(),
        payload: {},
        context: { enabled: true },
      };

      const result = await service.executeHook(hook, context);

      expect(result.success).toBe(true);
      expect(result.output).toBe('ran with context');
    });

    it('should handle condition errors gracefully', async () => {
      const hook: HookConfig = {
        id: 'cond-hook-3',
        name: 'Conditional',
        type: 'pre-execution',
        enabled: true,
        condition: 'context.nonExistent.property',
        action: {
          type: 'custom',
          code: 'return "should not run";',
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

      const result = await service.executeHook(hook, context);

      // Should skip the hook when condition fails
      expect(result.output).toBe('Condition not met, skipped');
    });

    it('should timeout condition evaluation', async () => {
      const hook: HookConfig = {
        id: 'cond-hook-4',
        name: 'Conditional',
        type: 'pre-execution',
        enabled: true,
        condition: 'while(true) {}; true',
        action: {
          type: 'custom',
          code: 'return "should not run";',
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

      const result = await service.executeHook(hook, context);

      // Should skip when condition times out
      expect(result.output).toBe('Condition not met, skipped');
    });
  });
});
