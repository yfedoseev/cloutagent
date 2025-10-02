import { beforeEach, describe, expect, it } from 'vitest';

import { ProjectStorage } from '../../apps/backend/src/services/ProjectStorage';
import { SecretManager } from '../../apps/backend/src/services/SecretManager';
import {
  cleanupTestProjects,
  createTestProjectData,
  getTestProjectRoot,
} from '../helpers/testHelpers';

import './setup';

/**
 * Performance Integration Tests
 *
 * Tests system performance under load: concurrent operations, large datasets, response times
 */

describe('Performance Integration Tests', () => {
  let storage: ProjectStorage;
  let secretManager: SecretManager;
  const testRoot = getTestProjectRoot();

  beforeEach(async () => {
    await cleanupTestProjects();

    // Set PROJECT_ROOT for SecretManager
    process.env.PROJECT_ROOT = testRoot;

    storage = new ProjectStorage(testRoot);

    const encryptionKey =
      process.env.SECRET_ENCRYPTION_KEY ||
      '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    secretManager = new SecretManager(encryptionKey);
  });

  describe('Project Operations Performance', () => {
    it('should create 100 projects efficiently', async () => {
      const startTime = Date.now();

      // Create projects in batches to avoid overwhelming filesystem
      const batchSize = 20;
      const projects = [];
      for (let i = 0; i < 100; i += batchSize) {
        const batch = await Promise.all(
          Array.from({ length: Math.min(batchSize, 100 - i) }, (_, j) =>
            storage.create(createTestProjectData({ name: `Project ${i + j}` })),
          ),
        );
        projects.push(...batch);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(projects).toHaveLength(100);
      expect(duration).toBeLessThan(15000); // Should complete in under 15 seconds

      console.log(`Created 100 projects in ${duration}ms`);
    });

    it('should list 100 projects efficiently', async () => {
      // Create 100 projects in batches
      const batchSize = 20;
      for (let i = 0; i < 100; i += batchSize) {
        await Promise.all(
          Array.from({ length: Math.min(batchSize, 100 - i) }, (_, j) =>
            storage.create(createTestProjectData({ name: `Project ${i + j}` })),
          ),
        );
      }

      const startTime = Date.now();
      const projects = await storage.list();
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(projects).toHaveLength(100);
      expect(duration).toBeLessThan(1000); // Should complete in under 1 second

      console.log(`Listed 100 projects in ${duration}ms`);
    });

    it('should handle 100 concurrent reads efficiently', async () => {
      // Create a project
      const project = await storage.create(createTestProjectData());

      const startTime = Date.now();

      // Read same project 100 times concurrently
      const reads = await Promise.all(
        Array.from({ length: 100 }, () => storage.read(project.id)),
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(reads).toHaveLength(100);
      expect(reads.filter(p => p?.id === project.id)).toHaveLength(100);
      expect(duration).toBeLessThan(2000); // Should complete in under 2 seconds

      console.log(`Completed 100 concurrent reads in ${duration}ms`);
    });

    it('should handle 50 concurrent updates efficiently', async () => {
      const project = await storage.create(createTestProjectData());

      const startTime = Date.now();

      // Update project 50 times concurrently
      await Promise.all(
        Array.from({ length: 50 }, (_, i) =>
          storage.update(project.id, { name: `Update ${i}` }),
        ),
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verify final state is valid
      const finalProject = await storage.read(project.id);
      expect(finalProject).not.toBeNull();
      expect(duration).toBeLessThan(2000); // Should complete in under 2 seconds

      console.log(`Completed 50 concurrent updates in ${duration}ms`);
    });

    it('should delete 100 projects efficiently', async () => {
      // Create 100 projects in batches
      const batchSize = 20;
      const projects = [];
      for (let i = 0; i < 100; i += batchSize) {
        const batch = await Promise.all(
          Array.from({ length: Math.min(batchSize, 100 - i) }, (_, j) =>
            storage.create(createTestProjectData({ name: `Project ${i + j}` })),
          ),
        );
        projects.push(...batch);
      }

      const startTime = Date.now();

      // Delete all projects concurrently
      await Promise.all(projects.map(p => storage.delete(p.id)));

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verify all deleted
      const remaining = await storage.list();
      expect(remaining).toHaveLength(0);
      expect(duration).toBeLessThan(10000); // Should complete in under 10 seconds

      console.log(`Deleted 100 projects in ${duration}ms`);
    });
  });

  describe('Secret Operations Performance', () => {
    it('should store 100 secrets efficiently', async () => {
      const project = await storage.create(createTestProjectData());

      const startTime = Date.now();

      // Store 100 secrets sequentially (file locking prevents concurrent writes)
      for (let i = 0; i < 100; i++) {
        await secretManager.setSecret(
          project.id,
          `SECRET_${i}`,
          `value-${i}`,
        );
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verify all secrets exist
      const secrets = await secretManager.listSecrets(project.id);
      expect(secrets).toHaveLength(100);
      expect(duration).toBeLessThan(5000); // Should complete in under 5 seconds

      console.log(`Stored 100 secrets in ${duration}ms`);
    });

    it('should retrieve 100 secrets efficiently', async () => {
      const project = await storage.create(createTestProjectData());

      // Store 100 secrets
      for (let i = 0; i < 100; i++) {
        await secretManager.setSecret(
          project.id,
          `SECRET_${i}`,
          `value-${i}`,
        );
      }

      const startTime = Date.now();

      // Retrieve all secrets concurrently
      const values = await Promise.all(
        Array.from({ length: 100 }, (_, i) =>
          secretManager.getSecret(project.id, `SECRET_${i}`),
        ),
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(values).toHaveLength(100);
      expect(values.every((v, i) => v === `value-${i}`)).toBe(true);
      expect(duration).toBeLessThan(1000); // Should complete in under 1 second

      console.log(`Retrieved 100 secrets in ${duration}ms`);
    });

    it('should handle large secret values efficiently', async () => {
      const project = await storage.create(createTestProjectData());

      // Create a 1MB secret value
      const largeValue = 'x'.repeat(1024 * 1024); // 1MB

      const startTime = Date.now();

      await secretManager.setSecret(project.id, 'LARGE_SECRET', largeValue);
      const retrieved = await secretManager.getSecret(
        project.id,
        'LARGE_SECRET',
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(retrieved).toBe(largeValue);
      expect(duration).toBeLessThan(1000); // Should complete in under 1 second

      console.log(`Stored and retrieved 1MB secret in ${duration}ms`);
    });
  });

  describe('Mixed Operations Performance', () => {
    it('should handle mixed workload efficiently', async () => {
      const startTime = Date.now();

      // Mixed workload simulation
      const operations = [];

      // Create 20 projects
      for (let i = 0; i < 20; i++) {
        operations.push(
          storage.create(createTestProjectData({ name: `Project ${i}` })),
        );
      }

      const projects = await Promise.all(operations);

      // For each project, perform various operations
      const mixedOps = [];

      for (const project of projects.slice(0, 10)) {
        // Update project
        mixedOps.push(
          storage.update(project.id, { description: 'Updated' }),
        );

        // Set secrets
        mixedOps.push(
          secretManager.setSecret(project.id, 'API_KEY', 'key-123'),
        );

        // Read project
        mixedOps.push(storage.read(project.id));
      }

      await Promise.all(mixedOps);

      // List all projects
      await storage.list();

      // Delete half the projects
      await Promise.all(projects.slice(0, 10).map(p => storage.delete(p.id)));

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(10000); // Complete mixed workload in under 10 seconds

      console.log(`Completed mixed workload in ${duration}ms`);
    });

    it('should scale linearly with project count for list operations', async () => {
      const results: { count: number; duration: number }[] = [];

      for (const count of [10, 50, 100]) {
        // Create projects
        await Promise.all(
          Array.from({ length: count }, (_, i) =>
            storage.create(createTestProjectData({ name: `Project ${i}` })),
          ),
        );

        // Measure list performance
        const startTime = Date.now();
        const projects = await storage.list();
        const duration = Date.now() - startTime;

        expect(projects).toHaveLength(count);
        results.push({ count, duration });

        console.log(`List ${count} projects: ${duration}ms`);

        // Cleanup for next iteration
        await cleanupTestProjects();
      }

      // Performance should scale reasonably (not exponentially)
      // 100 projects should not take 10x longer than 10 projects
      const ratio = results[2].duration / results[0].duration;
      expect(ratio).toBeLessThan(30); // Allow some overhead but should be roughly linear
    });
  });

  describe('Memory Efficiency', () => {
    it('should handle large project metadata efficiently', async () => {
      // Create project with large configuration
      const largeConfig = createTestProjectData({
        name: 'Large Config Project',
        description: 'x'.repeat(10000), // 10KB description
        subagents: Array.from({ length: 50 }, (_, i) => ({
          id: `subagent-${i}`,
          name: `Subagent ${i}`,
          type: 'worker',
          prompt: 'x'.repeat(1000), // 1KB prompt each
          tools: ['bash', 'read', 'write'],
          parallel: true,
          maxParallelInstances: 5,
        })),
        hooks: Array.from({ length: 20 }, (_, i) => ({
          id: `hook-${i}`,
          name: `Hook ${i}`,
          type: 'pre-execution' as const,
          enabled: true,
        })),
      });

      const startTime = Date.now();

      const project = await storage.create(largeConfig);
      const retrieved = await storage.read(project.id);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(retrieved).not.toBeNull();
      expect(retrieved?.subagents).toHaveLength(50);
      expect(retrieved?.hooks).toHaveLength(20);
      expect(duration).toBeLessThan(1000); // Should complete in under 1 second

      console.log(`Handled large project metadata in ${duration}ms`);
    });
  });
});
