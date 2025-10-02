import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

/**
 * Encrypted secret format stored in JSON
 */
interface EncryptedSecret {
  iv: string; // hex-encoded initialization vector
  authTag: string; // hex-encoded authentication tag
  encrypted: string; // hex-encoded ciphertext
}

/**
 * Secret storage record
 */
interface SecretStore {
  [secretName: string]: string; // JSON-encoded EncryptedSecret
}

/**
 * Simple file-based lock manager for preventing race conditions
 */
class FileLock {
  private locks = new Map<string, Promise<void>>();

  async acquire(key: string): Promise<() => void> {
    // Wait for existing lock on this key
    while (this.locks.has(key)) {
      await this.locks.get(key);
    }

    // Create new lock
    let releaseLock: () => void = () => {};
    const lockPromise = new Promise<void>(resolve => {
      releaseLock = () => {
        this.locks.delete(key);
        resolve();
      };
    });

    this.locks.set(key, lockPromise);
    return releaseLock;
  }
}

/**
 * SecretManager - Secure secret storage with AES-256-GCM encryption
 *
 * Implements the ISecretManager interface from the execution plan.
 * All secrets are encrypted at rest using AES-256-GCM with a random IV per encryption.
 *
 * Storage format:
 * - Secrets stored in: ./projects/{projectId}/.secrets/secrets.enc
 * - Each secret encrypted individually with unique IV
 * - Authentication tag prevents tampering
 *
 * Security guarantees:
 * - AES-256-GCM authenticated encryption
 * - Random IV per encryption (prevents deterministic encryption)
 * - Auth tag verification (prevents tampering)
 * - No logging of decrypted values
 * - Secret names only in listings (never values)
 */
export class SecretManager {
  private readonly algorithm = 'aes-256-gcm';
  private readonly encryptionKey: Buffer;
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits
  private readonly fileLock = new FileLock();

  /**
   * Initialize SecretManager with encryption key
   *
   * @param keyHex - 64 character hex string (32 bytes)
   * @throws Error if key is invalid format or length
   */
  constructor(keyHex: string) {
    // Validate encryption key format
    if (!keyHex || typeof keyHex !== 'string') {
      throw new Error('Encryption key must be a non-empty string');
    }

    if (keyHex.length !== 64) {
      throw new Error('Encryption key must be 64 hex characters (32 bytes)');
    }

    if (!/^[0-9a-fA-F]{64}$/.test(keyHex)) {
      throw new Error('Encryption key must be valid hexadecimal');
    }

    this.encryptionKey = Buffer.from(keyHex, 'hex');
  }

  /**
   * Encrypt plaintext using AES-256-GCM
   *
   * @param plaintext - Secret value to encrypt
   * @returns JSON string containing {iv, authTag, encrypted}
   */
  async encrypt(plaintext: string): Promise<string> {
    // Generate random IV for this encryption
    const iv = crypto.randomBytes(this.ivLength);

    // Create cipher
    const cipher = crypto.createCipheriv(
      this.algorithm,
      this.encryptionKey,
      iv,
    );

    // Encrypt plaintext
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Get authentication tag
    const authTag = cipher.getAuthTag();

    // Return JSON-encoded encrypted secret
    const encryptedSecret: EncryptedSecret = {
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      encrypted,
    };

    return JSON.stringify(encryptedSecret);
  }

  /**
   * Decrypt ciphertext using AES-256-GCM
   *
   * @param ciphertext - JSON string containing {iv, authTag, encrypted}
   * @returns Decrypted plaintext
   * @throws Error if ciphertext is tampered or invalid
   */
  async decrypt(ciphertext: string): Promise<string> {
    let encryptedSecret: EncryptedSecret;

    // Parse JSON
    try {
      encryptedSecret = JSON.parse(ciphertext);
    } catch (error) {
      throw new Error('Invalid encrypted secret format: not valid JSON');
    }

    // Validate required fields
    if (
      !encryptedSecret.iv ||
      !encryptedSecret.authTag ||
      !encryptedSecret.encrypted
    ) {
      throw new Error(
        'Invalid encrypted secret format: missing required fields (iv, authTag, encrypted)',
      );
    }

    // Convert hex strings to buffers
    const iv = Buffer.from(encryptedSecret.iv, 'hex');
    const authTag = Buffer.from(encryptedSecret.authTag, 'hex');

    // Create decipher
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.encryptionKey,
      iv,
    );

    // Set authentication tag
    decipher.setAuthTag(authTag);

    // Decrypt ciphertext
    let decrypted: string;
    try {
      decrypted = decipher.update(encryptedSecret.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
    } catch (error) {
      throw new Error(
        'Decryption failed: invalid authentication tag or corrupted data',
      );
    }

    return decrypted;
  }

  /**
   * Store encrypted secret for project
   *
   * @param projectId - Project identifier
   * @param name - Secret name (e.g., "ANTHROPIC_API_KEY")
   * @param value - Secret value to encrypt and store
   */
  async setSecret(
    projectId: string,
    name: string,
    value: string,
  ): Promise<void> {
    // Acquire lock for this project to prevent concurrent writes
    const release = await this.fileLock.acquire(projectId);

    try {
      // Get secrets file path
      const secretsPath = this.getSecretsPath(projectId);
      const secretsDir = path.dirname(secretsPath);

      // Ensure .secrets directory exists
      await fs.mkdir(secretsDir, { recursive: true });

      // Load existing secrets or create new store
      let secretStore: SecretStore = {};
      try {
        const fileContent = await fs.readFile(secretsPath, 'utf-8');
        secretStore = JSON.parse(fileContent);
      } catch (error) {
        // File doesn't exist or invalid JSON - start fresh
        secretStore = {};
      }

      // Encrypt secret value
      const encrypted = await this.encrypt(value);

      // Update secret store
      secretStore[name] = encrypted;

      // Write atomically (write to temp file with unique name, then rename)
      const tempPath = `${secretsPath}.tmp.${Date.now()}.${Math.random().toString(36).substring(7)}`;
      await fs.writeFile(
        tempPath,
        JSON.stringify(secretStore, null, 2),
        'utf-8',
      );

      try {
        await fs.rename(tempPath, secretsPath);
      } catch (renameError) {
        // Clean up temp file if rename failed
        await fs.unlink(tempPath).catch(() => {});
        throw renameError;
      }
    } finally {
      // Always release lock
      release();
    }
  }

  /**
   * Retrieve and decrypt secret
   *
   * @param projectId - Project identifier
   * @param name - Secret name
   * @returns Decrypted secret value, or null if not found
   */
  async getSecret(projectId: string, name: string): Promise<string | null> {
    try {
      const secretsPath = this.getSecretsPath(projectId);
      const fileContent = await fs.readFile(secretsPath, 'utf-8');
      const secretStore: SecretStore = JSON.parse(fileContent);

      if (!secretStore[name]) {
        return null;
      }

      // Decrypt and return secret
      return await this.decrypt(secretStore[name]);
    } catch (error) {
      // File doesn't exist or other error
      return null;
    }
  }

  /**
   * List all secret names for project (not values)
   *
   * @param projectId - Project identifier
   * @returns Array of secret names (never values)
   */
  async listSecrets(projectId: string): Promise<string[]> {
    try {
      const secretsPath = this.getSecretsPath(projectId);
      const fileContent = await fs.readFile(secretsPath, 'utf-8');
      const secretStore: SecretStore = JSON.parse(fileContent);

      // Return only keys (secret names), never values
      return Object.keys(secretStore);
    } catch (error) {
      // File doesn't exist or other error
      return [];
    }
  }

  /**
   * Delete secret from storage
   *
   * @param projectId - Project identifier
   * @param name - Secret name to delete
   */
  async deleteSecret(projectId: string, name: string): Promise<void> {
    // Acquire lock for this project to prevent concurrent writes
    const release = await this.fileLock.acquire(projectId);

    try {
      const secretsPath = this.getSecretsPath(projectId);
      const fileContent = await fs.readFile(secretsPath, 'utf-8');
      const secretStore: SecretStore = JSON.parse(fileContent);

      // Remove secret from store
      delete secretStore[name];

      // Write updated store atomically (with unique temp file name)
      const tempPath = `${secretsPath}.tmp.${Date.now()}.${Math.random().toString(36).substring(7)}`;
      await fs.writeFile(
        tempPath,
        JSON.stringify(secretStore, null, 2),
        'utf-8',
      );

      try {
        await fs.rename(tempPath, secretsPath);
      } catch (renameError) {
        // Clean up temp file if rename failed
        await fs.unlink(tempPath).catch(() => {});
        throw renameError;
      }
    } catch (error) {
      // File doesn't exist or secret doesn't exist - silently succeed
      // (idempotent delete operation)
    } finally {
      // Always release lock
      release();
    }
  }

  /**
   * Get path to secrets file for project
   *
   * @param projectId - Project identifier
   * @returns Absolute path to secrets.enc file
   */
  private getSecretsPath(projectId: string): string {
    const projectRoot =
      process.env.PROJECT_ROOT || path.join(process.cwd(), 'projects');
    return path.join(projectRoot, projectId, '.secrets', 'secrets.enc');
  }
}
