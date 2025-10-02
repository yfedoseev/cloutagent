import fs from 'fs/promises';
import path from 'path';
import { beforeEach, describe, expect, it } from 'vitest';

import type { Project } from '@cloutagent/types';

import { ProjectStorage } from '../../apps/backend/src/services/ProjectStorage';
import { SecretManager } from '../../apps/backend/src/services/SecretManager';
import {
  cleanupTestProjects,
  createTestProjectData,
  getTestProjectRoot,
  readJSONFile,
  verifyDirectoryExists,
  verifyFileExists,
} from '../helpers/testHelpers';

import './setup';

/**
 * File System Integration Tests
 *
 * Tests complete filesystem operations: directory structure, atomic writes, permissions
 */

describe('File System Integration Tests', () => {
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

  describe('Project Directory Structure', () => {
    it('should create proper directory structure on project creation', async () => {
      const project = await storage.create(createTestProjectData());

      const projectDir = path.join(testRoot, project.id);
      const metadataPath = path.join(projectDir, 'metadata.json');

      // Verify directory exists
      expect(await verifyDirectoryExists(projectDir)).toBe(true);

      // Verify metadata.json exists
      expect(await verifyFileExists(metadataPath)).toBe(true);

      // Verify metadata is valid JSON
      const metadata = await readJSONFile<Project>(metadataPath);
      expect(metadata).not.toBeNull();
      expect(metadata?.id).toBe(project.id);
    });

    it('should create secrets directory when storing secrets', async () => {
      const project = await storage.create(createTestProjectData());

      // Store a secret
      await secretManager.setSecret(
        project.id,
        'TEST_SECRET',
        'secret-value-123',
      );

      const secretsDir = path.join(testRoot, project.id, '.secrets');
      const secretsFile = path.join(secretsDir, 'secrets.enc');

      // Verify .secrets directory exists
      expect(await verifyDirectoryExists(secretsDir)).toBe(true);

      // Verify secrets.enc exists
      expect(await verifyFileExists(secretsFile)).toBe(true);
    });

    it('should maintain proper JSON formatting in metadata', async () => {
      const project = await storage.create(
        createTestProjectData({ name: 'Format Test' }),
      );

      const metadataPath = path.join(testRoot, project.id, 'metadata.json');
      const content = await fs.readFile(metadataPath, 'utf-8');

      // Should be pretty-printed (indented)
      expect(content).toContain('\n');
      expect(content).toContain('  '); // 2-space indentation

      // Should be valid JSON
      expect(() => JSON.parse(content)).not.toThrow();
    });

    it('should delete entire directory structure on project deletion', async () => {
      const project = await storage.create(createTestProjectData());

      // Add a secret to create .secrets directory
      await secretManager.setSecret(project.id, 'TEST', 'value');

      const projectDir = path.join(testRoot, project.id);

      // Verify directory exists
      expect(await verifyDirectoryExists(projectDir)).toBe(true);

      // Delete project
      await storage.delete(project.id);

      // Verify directory is gone
      expect(await verifyDirectoryExists(projectDir)).toBe(false);
    });
  });

  describe('Atomic Writes', () => {
    it('should use atomic writes for metadata updates', async () => {
      const project = await storage.create(createTestProjectData());

      // Update project multiple times rapidly
      const updates = Array.from({ length: 10 }, (_, i) => ({
        name: `Update ${i}`,
      }));

      await Promise.all(
        updates.map((update, i) =>
          storage.update(project.id, update).catch(() => {
            // Some may fail due to race conditions, that's OK
          }),
        ),
      );

      // Verify metadata is not corrupted
      const metadataPath = path.join(testRoot, project.id, 'metadata.json');
      const content = await fs.readFile(metadataPath, 'utf-8');

      // Should be valid JSON (not corrupted)
      expect(() => JSON.parse(content)).not.toThrow();

      const metadata = JSON.parse(content);
      expect(metadata.id).toBe(project.id);
    });

    it('should not leave temp files after successful write', async () => {
      const project = await storage.create(createTestProjectData());

      await storage.update(project.id, { name: 'Updated' });

      const projectDir = path.join(testRoot, project.id);
      const files = await fs.readdir(projectDir);

      // Should only have metadata.json, no .tmp files
      expect(files).toContain('metadata.json');
      expect(files.some(f => f.includes('.tmp'))).toBe(false);
    });

    it('should use atomic writes for secret updates', async () => {
      const project = await storage.create(createTestProjectData());

      // Set multiple secrets rapidly
      await Promise.all([
        secretManager.setSecret(project.id, 'SECRET_1', 'value1'),
        secretManager.setSecret(project.id, 'SECRET_2', 'value2'),
        secretManager.setSecret(project.id, 'SECRET_3', 'value3'),
      ]);

      // Verify all secrets are stored correctly
      const secret1 = await secretManager.getSecret(project.id, 'SECRET_1');
      const secret2 = await secretManager.getSecret(project.id, 'SECRET_2');
      const secret3 = await secretManager.getSecret(project.id, 'SECRET_3');

      expect(secret1).toBe('value1');
      expect(secret2).toBe('value2');
      expect(secret3).toBe('value3');

      // Verify no temp files left behind
      const secretsDir = path.join(testRoot, project.id, '.secrets');
      const files = await fs.readdir(secretsDir);

      expect(files).toContain('secrets.enc');
      expect(files.some(f => f.includes('.tmp'))).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing project gracefully', async () => {
      const project = await storage.read('non-existent-id');
      expect(project).toBeNull();
    });

    it('should handle corrupted metadata gracefully', async () => {
      const project = await storage.create(createTestProjectData());

      // Corrupt the metadata file
      const metadataPath = path.join(testRoot, project.id, 'metadata.json');
      await fs.writeFile(metadataPath, 'invalid json {{{', 'utf-8');

      // Read should return null for corrupted data
      const readProject = await storage.read(project.id);
      expect(readProject).toBeNull();
    });

    it('should handle missing secrets file gracefully', async () => {
      const project = await storage.create(createTestProjectData());

      const secret = await secretManager.getSecret(
        project.id,
        'NON_EXISTENT_SECRET',
      );
      expect(secret).toBeNull();
    });

    it('should not fail when deleting non-existent project', async () => {
      // Should not throw
      await expect(storage.delete('non-existent-id')).resolves.not.toThrow();
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent project creation', async () => {
      // Create multiple projects concurrently
      const projects = await Promise.all([
        storage.create(createTestProjectData({ name: 'Project 1' })),
        storage.create(createTestProjectData({ name: 'Project 2' })),
        storage.create(createTestProjectData({ name: 'Project 3' })),
        storage.create(createTestProjectData({ name: 'Project 4' })),
        storage.create(createTestProjectData({ name: 'Project 5' })),
      ]);

      // All should have unique IDs
      const ids = projects.map(p => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(5);

      // All should be readable
      for (const project of projects) {
        const storedProject = await storage.read(project.id);
        expect(storedProject).not.toBeNull();
        expect(storedProject?.id).toBe(project.id);
      }
    });

    it('should handle concurrent updates to same project', async () => {
      const project = await storage.create(createTestProjectData());

      // Update same project concurrently with different values
      const updatePromises = Array.from({ length: 10 }, (_, i) =>
        storage.update(project.id, { name: `Update ${i}` }),
      );

      await Promise.all(updatePromises);

      // Final state should be valid (one of the updates won)
      const finalProject = await storage.read(project.id);
      expect(finalProject).not.toBeNull();
      expect(finalProject?.name).toMatch(/^Update \d$/);
    });

    it('should handle concurrent secret operations on same project', async () => {
      const project = await storage.create(createTestProjectData());

      // Set different secrets concurrently
      await Promise.all([
        secretManager.setSecret(project.id, 'API_KEY', 'key-123'),
        secretManager.setSecret(project.id, 'DB_PASSWORD', 'pass-456'),
        secretManager.setSecret(project.id, 'TOKEN', 'token-789'),
        secretManager.setSecret(project.id, 'SECRET', 'secret-abc'),
      ]);

      // All secrets should be retrievable
      expect(await secretManager.getSecret(project.id, 'API_KEY')).toBe(
        'key-123',
      );
      expect(await secretManager.getSecret(project.id, 'DB_PASSWORD')).toBe(
        'pass-456',
      );
      expect(await secretManager.getSecret(project.id, 'TOKEN')).toBe(
        'token-789',
      );
      expect(await secretManager.getSecret(project.id, 'SECRET')).toBe(
        'secret-abc',
      );
    });
  });

  describe('Data Integrity', () => {
    it('should preserve all project fields through write/read cycle', async () => {
      const originalData = createTestProjectData({
        name: 'Integrity Test',
        description: 'Testing data integrity',
        agent: {
          id: 'agent-123',
          name: 'Test Agent',
          systemPrompt: 'Complex system prompt with special chars: \n\t"\'',
          model: 'claude-sonnet-4-5',
          temperature: 0.75,
          maxTokens: 8192,
          enabledTools: ['bash', 'read', 'write'],
        },
        subagents: [
          {
            id: 'subagent-1',
            name: 'Test Subagent',
            type: 'test',
            prompt: 'Test prompt',
            tools: ['bash'],
            parallel: true,
            maxParallelInstances: 5,
          },
        ],
        limits: {
          maxTokens: 200000,
          maxCost: 25.0,
          timeout: 600000,
        },
      });

      const project = await storage.create(originalData);
      const retrieved = await storage.read(project.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved?.name).toBe(originalData.name);
      expect(retrieved?.description).toBe(originalData.description);
      expect(retrieved?.agent.systemPrompt).toBe(
        originalData.agent.systemPrompt,
      );
      expect(retrieved?.agent.temperature).toBe(originalData.agent.temperature);
      expect(retrieved?.subagents).toHaveLength(1);
      expect(retrieved?.limits.maxCost).toBe(originalData.limits.maxCost);
    });

    it('should preserve secret values through encryption/decryption cycle', async () => {
      const project = await storage.create(createTestProjectData());

      const testSecrets = {
        SIMPLE: 'simple-value',
        WITH_SPECIAL_CHARS: 'value!@#$%^&*()_+-={}[]|:";\'<>?,./`~',
        MULTILINE: 'line1\nline2\nline3',
        UNICODE: '你好世界 🌍 مرحبا العالم',
        LONG: 'x'.repeat(10000),
      };

      // Store all secrets sequentially (file locking requires sequential writes)
      for (const [name, value] of Object.entries(testSecrets)) {
        await secretManager.setSecret(project.id, name, value);
      }

      // Retrieve and verify all secrets (can be concurrent)
      const retrievedSecrets = await Promise.all(
        Object.keys(testSecrets).map(async name => ({
          name,
          value: await secretManager.getSecret(project.id, name),
        })),
      );

      // Verify all secrets match
      for (const { name, value } of retrievedSecrets) {
        expect(value).toBe(testSecrets[name as keyof typeof testSecrets]);
      }
    });
  });
});
