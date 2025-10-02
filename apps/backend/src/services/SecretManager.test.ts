import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { SecretManager } from './SecretManager';

describe('SecretManager', () => {
  let secretManager: SecretManager;
  let testProjectId: string;
  let testProjectPath: string;
  let encryptionKey: string;

  beforeEach(async () => {
    // Generate a random 32-byte encryption key (64 hex chars)
    encryptionKey = crypto.randomBytes(32).toString('hex');
    secretManager = new SecretManager(encryptionKey);

    // Create test project
    testProjectId = `test-project-${Date.now()}`;
    testProjectPath = path.join(process.cwd(), 'projects', testProjectId);

    // Create project directory
    await fs.mkdir(testProjectPath, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test project directory
    try {
      await fs.rm(testProjectPath, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('encrypt', () => {
    it('should encrypt secrets with AES-256-GCM', async () => {
      const plaintext = 'my-secret-api-key';
      const encrypted = await secretManager.encrypt(plaintext);

      // Verify encrypted format contains required fields
      expect(encrypted).toBeTruthy();
      const parsed = JSON.parse(encrypted);
      expect(parsed).toHaveProperty('iv');
      expect(parsed).toHaveProperty('authTag');
      expect(parsed).toHaveProperty('encrypted');

      // Verify fields are hex-encoded strings
      expect(typeof parsed.iv).toBe('string');
      expect(typeof parsed.authTag).toBe('string');
      expect(typeof parsed.encrypted).toBe('string');

      // Verify IV is 16 bytes (32 hex chars)
      expect(parsed.iv.length).toBe(32);

      // Verify auth tag is 16 bytes (32 hex chars)
      expect(parsed.authTag.length).toBe(32);
    });

    it('should produce different output each time due to random IV', async () => {
      const plaintext = 'my-secret-api-key';

      const encrypted1 = await secretManager.encrypt(plaintext);
      const encrypted2 = await secretManager.encrypt(plaintext);

      // Different IVs mean different ciphertexts
      expect(encrypted1).not.toBe(encrypted2);

      const parsed1 = JSON.parse(encrypted1);
      const parsed2 = JSON.parse(encrypted2);

      expect(parsed1.iv).not.toBe(parsed2.iv);
      expect(parsed1.encrypted).not.toBe(parsed2.encrypted);
    });
  });

  describe('decrypt', () => {
    it('should decrypt secrets correctly', async () => {
      const plaintext = 'my-secret-api-key-12345';

      const encrypted = await secretManager.encrypt(plaintext);
      const decrypted = await secretManager.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle special characters in secrets', async () => {
      const plaintext = 'sk-ant-api03-!@#$%^&*()_+-={}[]|:";\'<>?,./~`';

      const encrypted = await secretManager.encrypt(plaintext);
      const decrypted = await secretManager.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should throw error on invalid auth tag (tampered ciphertext)', async () => {
      const plaintext = 'my-secret-api-key';
      const encrypted = await secretManager.encrypt(plaintext);

      // Tamper with the encrypted data
      const parsed = JSON.parse(encrypted);
      parsed.encrypted = `${parsed.encrypted.slice(0, -2)}ff`; // Change last byte
      const tampered = JSON.stringify(parsed);

      await expect(secretManager.decrypt(tampered)).rejects.toThrow();
    });

    it('should throw error on invalid JSON format', async () => {
      await expect(secretManager.decrypt('invalid-json')).rejects.toThrow();
    });

    it('should throw error on missing required fields', async () => {
      const invalid = JSON.stringify({ iv: 'abc', encrypted: 'def' }); // missing authTag
      await expect(secretManager.decrypt(invalid)).rejects.toThrow();
    });
  });

  describe('setSecret', () => {
    it('should store encrypted secret in project directory', async () => {
      const secretName = 'ANTHROPIC_API_KEY';
      const secretValue = 'sk-ant-api03-test123456';

      await secretManager.setSecret(testProjectId, secretName, secretValue);

      // Verify secrets file exists
      const secretsPath = path.join(testProjectPath, '.secrets', 'secrets.enc');
      const exists = await fs
        .access(secretsPath)
        .then(() => true)
        .catch(() => false);
      expect(exists).toBe(true);

      // Verify file contains encrypted data
      const fileContent = await fs.readFile(secretsPath, 'utf-8');
      const secrets = JSON.parse(fileContent);

      expect(secrets).toHaveProperty(secretName);
      expect(secrets[secretName]).toBeTruthy();

      // Verify stored value is encrypted (contains required fields)
      const encryptedSecret = JSON.parse(secrets[secretName]);
      expect(encryptedSecret).toHaveProperty('iv');
      expect(encryptedSecret).toHaveProperty('authTag');
      expect(encryptedSecret).toHaveProperty('encrypted');
    });

    it('should create .secrets directory if it does not exist', async () => {
      const secretName = 'TEST_SECRET';
      const secretValue = 'test-value-123';

      // Ensure .secrets directory doesn't exist
      const secretsDir = path.join(testProjectPath, '.secrets');
      const exists = await fs
        .access(secretsDir)
        .then(() => true)
        .catch(() => false);
      expect(exists).toBe(false);

      await secretManager.setSecret(testProjectId, secretName, secretValue);

      // Verify .secrets directory was created
      const existsAfter = await fs
        .access(secretsDir)
        .then(() => true)
        .catch(() => false);
      expect(existsAfter).toBe(true);
    });

    it('should update existing secret', async () => {
      const secretName = 'API_KEY';
      const oldValue = 'old-value';
      const newValue = 'new-value';

      await secretManager.setSecret(testProjectId, secretName, oldValue);
      await secretManager.setSecret(testProjectId, secretName, newValue);

      const retrieved = await secretManager.getSecret(
        testProjectId,
        secretName,
      );
      expect(retrieved).toBe(newValue);
    });

    it('should handle multiple secrets in same project', async () => {
      await secretManager.setSecret(testProjectId, 'SECRET_1', 'value1');
      await secretManager.setSecret(testProjectId, 'SECRET_2', 'value2');
      await secretManager.setSecret(testProjectId, 'SECRET_3', 'value3');

      const secret1 = await secretManager.getSecret(testProjectId, 'SECRET_1');
      const secret2 = await secretManager.getSecret(testProjectId, 'SECRET_2');
      const secret3 = await secretManager.getSecret(testProjectId, 'SECRET_3');

      expect(secret1).toBe('value1');
      expect(secret2).toBe('value2');
      expect(secret3).toBe('value3');
    });
  });

  describe('getSecret', () => {
    it('should retrieve and decrypt secret', async () => {
      const secretName = 'DATABASE_PASSWORD';
      const secretValue = 'super-secret-password-123!@#';

      await secretManager.setSecret(testProjectId, secretName, secretValue);
      const retrieved = await secretManager.getSecret(
        testProjectId,
        secretName,
      );

      expect(retrieved).toBe(secretValue);
    });

    it('should return null for non-existent secret', async () => {
      const retrieved = await secretManager.getSecret(
        testProjectId,
        'NON_EXISTENT',
      );
      expect(retrieved).toBeNull();
    });

    it('should return null for non-existent project', async () => {
      const retrieved = await secretManager.getSecret(
        'non-existent-project',
        'ANY_SECRET',
      );
      expect(retrieved).toBeNull();
    });
  });

  describe('listSecrets', () => {
    it('should return secret names only (not values)', async () => {
      await secretManager.setSecret(testProjectId, 'SECRET_1', 'value1');
      await secretManager.setSecret(testProjectId, 'SECRET_2', 'value2');
      await secretManager.setSecret(testProjectId, 'SECRET_3', 'value3');

      const secretNames = await secretManager.listSecrets(testProjectId);

      expect(secretNames).toHaveLength(3);
      expect(secretNames).toContain('SECRET_1');
      expect(secretNames).toContain('SECRET_2');
      expect(secretNames).toContain('SECRET_3');

      // Verify no values are exposed
      secretNames.forEach(name => {
        expect(name).not.toContain('value');
      });
    });

    it('should return empty array for project with no secrets', async () => {
      const secretNames = await secretManager.listSecrets(testProjectId);
      expect(secretNames).toEqual([]);
    });

    it('should return empty array for non-existent project', async () => {
      const secretNames = await secretManager.listSecrets(
        'non-existent-project',
      );
      expect(secretNames).toEqual([]);
    });
  });

  describe('deleteSecret', () => {
    it('should remove secret from storage', async () => {
      const secretName = 'TO_DELETE';
      await secretManager.setSecret(testProjectId, secretName, 'some-value');

      // Verify secret exists
      let secretNames = await secretManager.listSecrets(testProjectId);
      expect(secretNames).toContain(secretName);

      // Delete secret
      await secretManager.deleteSecret(testProjectId, secretName);

      // Verify secret is gone
      secretNames = await secretManager.listSecrets(testProjectId);
      expect(secretNames).not.toContain(secretName);

      // Verify getSecret returns null
      const retrieved = await secretManager.getSecret(
        testProjectId,
        secretName,
      );
      expect(retrieved).toBeNull();
    });

    it('should not throw error when deleting non-existent secret', async () => {
      await expect(
        secretManager.deleteSecret(testProjectId, 'NON_EXISTENT'),
      ).resolves.not.toThrow();
    });

    it('should preserve other secrets when deleting one', async () => {
      await secretManager.setSecret(testProjectId, 'SECRET_1', 'value1');
      await secretManager.setSecret(testProjectId, 'SECRET_2', 'value2');
      await secretManager.setSecret(testProjectId, 'SECRET_3', 'value3');

      await secretManager.deleteSecret(testProjectId, 'SECRET_2');

      const secretNames = await secretManager.listSecrets(testProjectId);
      expect(secretNames).toHaveLength(2);
      expect(secretNames).toContain('SECRET_1');
      expect(secretNames).toContain('SECRET_3');
      expect(secretNames).not.toContain('SECRET_2');
    });
  });

  describe('encryption key validation', () => {
    it('should throw error if encryption key is not 64 hex chars', () => {
      expect(() => new SecretManager('invalid-key')).toThrow();
    });

    it('should throw error if encryption key is too short', () => {
      expect(() => new SecretManager('abc123')).toThrow();
    });

    it('should throw error if encryption key is empty', () => {
      expect(() => new SecretManager('')).toThrow();
    });

    it('should accept valid 64-char hex key', () => {
      const validKey = crypto.randomBytes(32).toString('hex');
      expect(() => new SecretManager(validKey)).not.toThrow();
    });
  });

  describe('security requirements', () => {
    it('should never log decrypted secrets', async () => {
      // This is a documentation test - implementation should ensure
      // no console.log or logger calls with decrypted values
      const secretValue = 'sk-ant-secret-key-12345';

      await secretManager.setSecret(testProjectId, 'TEST_SECRET', secretValue);
      const retrieved = await secretManager.getSecret(
        testProjectId,
        'TEST_SECRET',
      );

      expect(retrieved).toBe(secretValue);
      // In implementation, verify no logging of `retrieved` or `secretValue`
    });

    it('should not expose encrypted values in listings', async () => {
      await secretManager.setSecret(testProjectId, 'SECRET_1', 'value1');
      await secretManager.setSecret(testProjectId, 'SECRET_2', 'value2');

      const secretNames = await secretManager.listSecrets(testProjectId);

      // Verify only names are returned, not objects with values
      secretNames.forEach(name => {
        expect(typeof name).toBe('string');
      });
    });
  });

  describe('file system operations', () => {
    it('should handle concurrent writes to same project', async () => {
      // Test atomic writes by setting multiple secrets concurrently
      const promises = [
        secretManager.setSecret(testProjectId, 'CONCURRENT_1', 'value1'),
        secretManager.setSecret(testProjectId, 'CONCURRENT_2', 'value2'),
        secretManager.setSecret(testProjectId, 'CONCURRENT_3', 'value3'),
      ];

      await Promise.all(promises);

      const secretNames = await secretManager.listSecrets(testProjectId);
      expect(secretNames).toHaveLength(3);
      expect(secretNames).toContain('CONCURRENT_1');
      expect(secretNames).toContain('CONCURRENT_2');
      expect(secretNames).toContain('CONCURRENT_3');
    });

    it('should create directory structure atomically', async () => {
      // Ensure directory creation doesn't fail on race conditions
      const projectId = `concurrent-test-${Date.now()}`;
      const projectPath = path.join(process.cwd(), 'projects', projectId);

      try {
        await Promise.all([
          secretManager.setSecret(projectId, 'TEST_1', 'value1'),
          secretManager.setSecret(projectId, 'TEST_2', 'value2'),
        ]);

        const secretNames = await secretManager.listSecrets(projectId);
        expect(secretNames).toHaveLength(2);
      } finally {
        // Cleanup
        await fs.rm(projectPath, { recursive: true, force: true });
      }
    });
  });
});
