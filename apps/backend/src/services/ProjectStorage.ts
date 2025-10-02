import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import path from 'path';

import type { Project } from '@cloutagent/types';

/**
 * Interface for Project Storage operations
 */
export interface IProjectStorage {
  create(
    project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Project>;
  read(id: string): Promise<Project | null>;
  update(id: string, updates: Partial<Project>): Promise<Project>;
  delete(id: string): Promise<void>;
  list(): Promise<Project[]>;
  exists(id: string): Promise<boolean>;
}

/**
 * File system-based project storage implementation
 *
 * Features:
 * - Atomic writes using temp files + rename
 * - Thread-safe operations with per-project locks
 * - JSON persistence with pretty printing
 * - Comprehensive error handling
 */
export class ProjectStorage implements IProjectStorage {
  private readonly projectsDir: string;
  private readonly locks: Map<string, Promise<void>> = new Map();

  constructor(baseDir: string = './projects') {
    this.projectsDir = baseDir;
  }

  /**
   * Create a new project with generated ID and timestamps
   */
  async create(
    projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Project> {
    const now = new Date().toISOString();
    const project: Project = {
      ...projectData,
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
    };

    await this.ensureProjectsDirectory();
    await this.writeProject(project);

    return project;
  }

  /**
   * Read project by ID
   * Returns null if project doesn't exist or is invalid
   */
  async read(id: string): Promise<Project | null> {
    try {
      const metadataPath = this.getMetadataPath(id);
      const content = await fs.readFile(metadataPath, 'utf-8');
      const project = JSON.parse(content) as Project;
      return project;
    } catch (error) {
      // Return null for missing files or invalid JSON
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      if (error instanceof SyntaxError) {
        // Invalid JSON
        return null;
      }
      throw error;
    }
  }

  /**
   * Update project fields
   * Automatically updates updatedAt timestamp
   * Throws error if project doesn't exist
   */
  async update(id: string, updates: Partial<Project>): Promise<Project> {
    const existing = await this.read(id);
    if (!existing) {
      throw new Error(`Project not found: ${id}`);
    }

    const updated: Project = {
      ...existing,
      ...updates,
      id: existing.id, // ID cannot be changed
      createdAt: existing.createdAt, // createdAt cannot be changed
      updatedAt: new Date().toISOString(),
    };

    await this.writeProject(updated);
    return updated;
  }

  /**
   * Delete project and remove all associated files
   * Does not throw error if project doesn't exist
   */
  async delete(id: string): Promise<void> {
    try {
      const projectDir = this.getProjectDir(id);
      await fs.rm(projectDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore errors for non-existent projects
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  /**
   * List all projects sorted by updatedAt (newest first)
   * Skips invalid projects
   */
  async list(): Promise<Project[]> {
    try {
      await this.ensureProjectsDirectory();
      const entries = await fs.readdir(this.projectsDir, {
        withFileTypes: true,
      });

      const projects: Project[] = [];

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const project = await this.read(entry.name);
          if (project) {
            projects.push(project);
          }
        }
      }

      // Sort by updatedAt, newest first
      projects.sort((a, b) => {
        return (
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      });

      return projects;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  /**
   * Check if project exists
   */
  async exists(id: string): Promise<boolean> {
    try {
      const metadataPath = this.getMetadataPath(id);
      await fs.access(metadataPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Private helper methods
   */

  /**
   * Acquire a lock for a project ID to ensure sequential writes
   */
  private async acquireLock(id: string): Promise<() => void> {
    // Wait for any existing lock on this project
    while (this.locks.has(id)) {
      await this.locks.get(id);
    }

    // Create a new lock
    let releaseLock!: () => void;
    const lockPromise = new Promise<void>(resolve => {
      releaseLock = resolve;
    });

    this.locks.set(id, lockPromise);

    // Return the release function
    return () => {
      this.locks.delete(id);
      releaseLock();
    };
  }

  private getProjectDir(id: string): string {
    return path.join(this.projectsDir, id);
  }

  private getMetadataPath(id: string): string {
    return path.join(this.getProjectDir(id), 'metadata.json');
  }

  private async ensureProjectsDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.projectsDir, { recursive: true });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
        throw error;
      }
    }
  }

  /**
   * Atomic write using temp file + rename
   * This ensures we never have partial writes
   * Uses per-project locking to prevent concurrent write conflicts
   */
  private async writeProject(project: Project): Promise<void> {
    const releaseLock = await this.acquireLock(project.id);

    try {
      const projectDir = this.getProjectDir(project.id);
      const metadataPath = this.getMetadataPath(project.id);
      const tempPath = `${metadataPath}.tmp`;

      try {
        // Ensure project directory exists
        await fs.mkdir(projectDir, { recursive: true });

        // Write to temp file with pretty JSON
        const content = JSON.stringify(project, null, 2);
        await fs.writeFile(tempPath, content, 'utf-8');

        // Atomic rename
        await fs.rename(tempPath, metadataPath);
      } catch (error) {
        // Clean up temp file on error
        try {
          await fs.unlink(tempPath);
        } catch {
          // Ignore cleanup errors
        }
        throw error;
      }
    } finally {
      releaseLock();
    }
  }
}
