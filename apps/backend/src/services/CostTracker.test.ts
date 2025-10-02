import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CostTracker } from './CostTracker';
import type { TokenUsage } from '@cloutagent/types';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('CostTracker', () => {
  let costTracker: CostTracker;
  const testCostsDir = '/tmp/test-costs';

  beforeEach(async () => {
    await fs.mkdir(testCostsDir, { recursive: true });
    costTracker = new CostTracker(testCostsDir);
  });

  afterEach(async () => {
    await fs.rm(testCostsDir, { recursive: true, force: true });
  });

  describe('calculateCost', () => {
    it('should calculate cost for input and output tokens correctly', () => {
      const usage: TokenUsage = {
        input: 1000,
        output: 500,
        total: 1500,
      };

      const cost = costTracker.calculateCost(usage);

      // $3/1M input * 1000 = $0.003
      // $15/1M output * 500 = $0.0075
      // Total = $0.0105
      expect(cost).toBeCloseTo(0.0105, 4);
    });

    it('should handle zero tokens', () => {
      const usage: TokenUsage = {
        input: 0,
        output: 0,
        total: 0,
      };

      const cost = costTracker.calculateCost(usage);
      expect(cost).toBe(0);
    });

    it('should calculate cost without total field', () => {
      const usage: TokenUsage = {
        input: 2000,
        output: 1000,
      };

      const cost = costTracker.calculateCost(usage);

      // $3/1M * 2000 + $15/1M * 1000 = $0.006 + $0.015 = $0.021
      expect(cost).toBeCloseTo(0.021, 4);
    });
  });

  describe('trackTokens', () => {
    it('should track tokens for execution', () => {
      const executionId = 'exec-001';
      const usage: TokenUsage = {
        input: 1000,
        output: 500,
        total: 1500,
      };

      costTracker.trackTokens(executionId, usage);

      const cost = costTracker.getExecutionCost(executionId);
      expect(cost).toBeCloseTo(0.0105, 4);
    });

    it('should accumulate tokens for same execution', () => {
      const executionId = 'exec-001';

      costTracker.trackTokens(executionId, { input: 1000, output: 500 });
      costTracker.trackTokens(executionId, { input: 500, output: 250 });

      const cost = costTracker.getExecutionCost(executionId);

      // First: $0.003 + $0.0075 = $0.0105
      // Second: $0.0015 + $0.00375 = $0.00525
      // Total: $0.01575
      expect(cost).toBeCloseTo(0.01575, 4);
    });
  });

  describe('checkLimits', () => {
    it('should return within limits when no limits exceeded', () => {
      const executionId = 'exec-001';
      costTracker.trackTokens(executionId, { input: 1000, output: 500 });

      const result = costTracker.checkLimits(executionId, {
        maxTokens: 2000,
        maxCost: 0.05,
      });

      expect(result.withinLimits).toBe(true);
      expect(result.exceeded).toBeUndefined();
    });

    it('should detect token limit exceeded', () => {
      const executionId = 'exec-001';
      costTracker.trackTokens(executionId, { input: 1500, output: 800 });

      const result = costTracker.checkLimits(executionId, {
        maxTokens: 2000,
      });

      expect(result.withinLimits).toBe(false);
      expect(result.exceeded).toEqual({
        type: 'tokens',
        current: 2300,
        limit: 2000,
      });
    });

    it('should detect cost limit exceeded', () => {
      const executionId = 'exec-001';
      costTracker.trackTokens(executionId, { input: 10000, output: 5000 });

      const result = costTracker.checkLimits(executionId, {
        maxCost: 0.05,
      });

      expect(result.withinLimits).toBe(false);
      expect(result.exceeded).toEqual({
        type: 'cost',
        current: 0.105,
        limit: 0.05,
      });
    });

    it('should return within limits when no limits specified', () => {
      const executionId = 'exec-001';
      costTracker.trackTokens(executionId, { input: 10000, output: 5000 });

      const result = costTracker.checkLimits(executionId, {});

      expect(result.withinLimits).toBe(true);
    });
  });

  describe('getExecutionCost', () => {
    it('should return 0 for unknown execution', () => {
      const cost = costTracker.getExecutionCost('unknown-exec');
      expect(cost).toBe(0);
    });

    it('should return correct cost for tracked execution', () => {
      const executionId = 'exec-001';
      costTracker.trackTokens(executionId, { input: 2000, output: 1000 });

      const cost = costTracker.getExecutionCost(executionId);
      expect(cost).toBeCloseTo(0.021, 4);
    });
  });

  describe('getProjectTotalCost', () => {
    it('should aggregate costs across multiple executions', async () => {
      const projectId = 'proj-001';

      costTracker.trackTokens('exec-001', { input: 1000, output: 500 });
      costTracker.trackTokens('exec-002', { input: 2000, output: 1000 });

      // Save costs to project file
      await costTracker.saveProjectCost(projectId, 'exec-001');
      await costTracker.saveProjectCost(projectId, 'exec-002');

      const totalCost = await costTracker.getProjectTotalCost(projectId);

      // exec-001: $0.0105
      // exec-002: $0.021
      // Total: $0.0315
      expect(totalCost).toBeCloseTo(0.0315, 4);
    });

    it('should return 0 for project with no costs', async () => {
      const totalCost = await costTracker.getProjectTotalCost('unknown-proj');
      expect(totalCost).toBe(0);
    });

    it('should handle corrupted cost file gracefully', async () => {
      const projectId = 'proj-001';
      const projectCostFile = path.join(testCostsDir, `${projectId}.json`);

      await fs.writeFile(projectCostFile, 'invalid json');

      const totalCost = await costTracker.getProjectTotalCost(projectId);
      expect(totalCost).toBe(0);
    });
  });

  describe('persistence', () => {
    it('should persist execution costs to file', async () => {
      const projectId = 'proj-001';
      const executionId = 'exec-001';

      costTracker.trackTokens(executionId, { input: 1000, output: 500 });
      await costTracker.saveProjectCost(projectId, executionId);

      const projectCostFile = path.join(testCostsDir, `${projectId}.json`);
      const fileContent = await fs.readFile(projectCostFile, 'utf-8');
      const data = JSON.parse(fileContent);

      expect(data).toHaveProperty('executions');
      expect(data.executions).toHaveProperty(executionId);
      expect(data.executions[executionId].cost).toBeCloseTo(0.0105, 4);
    });
  });
});
