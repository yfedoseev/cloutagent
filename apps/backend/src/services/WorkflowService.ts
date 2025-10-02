import { promises as fs } from 'fs';
import path from 'path';
import { WorkflowData } from '@cloutagent/types';

/**
 * WorkflowService handles saving, loading, and validating workflow data
 * Implements atomic writes and comprehensive validation
 */
export class WorkflowService {
  private readonly projectsDir: string;

  constructor(baseDir: string = './projects') {
    this.projectsDir = baseDir;
  }

  /**
   * Save workflow to project with atomic write
   * @param projectId - Project identifier
   * @param workflow - Workflow data to save
   */
  async saveWorkflow(
    projectId: string,
    workflow: WorkflowData,
  ): Promise<void> {
    // Validate workflow structure
    this.validateWorkflow(workflow);

    const workflowPath = this.getWorkflowPath(projectId);
    await fs.mkdir(path.dirname(workflowPath), { recursive: true });

    // Add version if not present
    const versionedWorkflow = {
      ...workflow,
      version: workflow.version || '1.0.0',
    };

    // Atomic write: write to temp file, then rename
    const tempPath = `${workflowPath}.tmp`;
    await fs.writeFile(
      tempPath,
      JSON.stringify(versionedWorkflow, null, 2),
      'utf-8',
    );
    await fs.rename(tempPath, workflowPath);

    // Update project metadata
    await this.updateProjectMetadata(projectId);
  }

  /**
   * Load workflow from project
   * @param projectId - Project identifier
   * @returns Workflow data or empty workflow if not found
   */
  async loadWorkflow(projectId: string): Promise<WorkflowData | null> {
    const workflowPath = this.getWorkflowPath(projectId);

    try {
      const content = await fs.readFile(workflowPath, 'utf-8');
      const workflow = JSON.parse(content) as WorkflowData;

      // Validate loaded workflow
      this.validateWorkflow(workflow);

      return workflow;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // File doesn't exist - return empty workflow
        return {
          nodes: [],
          edges: [],
          viewport: { x: 0, y: 0, zoom: 1 },
          version: '1.0.0',
        };
      }
      throw error;
    }
  }

  /**
   * Autosave workflow (doesn't update metadata)
   * @param projectId - Project identifier
   * @param workflow - Workflow data to autosave
   */
  async autosaveWorkflow(
    projectId: string,
    workflow: WorkflowData,
  ): Promise<void> {
    // Same as saveWorkflow but creates autosave backup
    const autosavePath = this.getAutosavePath(projectId);
    await fs.mkdir(path.dirname(autosavePath), { recursive: true });

    await fs.writeFile(
      autosavePath,
      JSON.stringify({ ...workflow, version: workflow.version || '1.0.0' }, null, 2),
      'utf-8',
    );
  }

  /**
   * Get list of workflow versions
   * @param projectId - Project identifier
   * @returns List of version filenames in reverse chronological order
   */
  async getWorkflowVersions(projectId: string): Promise<string[]> {
    // List all saved versions (for future versioning feature)
    const versionsDir = path.join(this.projectsDir, projectId, 'versions');

    try {
      const files = await fs.readdir(versionsDir);
      return files.filter(f => f.endsWith('.json')).sort().reverse();
    } catch {
      return [];
    }
  }

  /**
   * Validate workflow structure and relationships
   * @param workflow - Workflow to validate
   * @throws Error if validation fails
   */
  private validateWorkflow(workflow: WorkflowData): void {
    // Validate nodes
    if (!Array.isArray(workflow.nodes)) {
      throw new Error('Workflow nodes must be an array');
    }

    workflow.nodes.forEach(node => {
      if (!node.id || !node.type || !node.position) {
        throw new Error(`Invalid node structure: ${JSON.stringify(node)}`);
      }
    });

    // Validate edges
    if (!Array.isArray(workflow.edges)) {
      throw new Error('Workflow edges must be an array');
    }

    const nodeIds = new Set(workflow.nodes.map(n => n.id));
    workflow.edges.forEach(edge => {
      if (!edge.id || !edge.source || !edge.target) {
        throw new Error(`Invalid edge structure: ${JSON.stringify(edge)}`);
      }

      if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
        throw new Error(`Edge references non-existent node: ${edge.id}`);
      }
    });

    // Validate viewport
    if (!workflow.viewport || typeof workflow.viewport.zoom !== 'number') {
      throw new Error('Invalid viewport structure');
    }
  }

  /**
   * Update project metadata with current timestamp
   * @param projectId - Project identifier
   */
  private async updateProjectMetadata(projectId: string): Promise<void> {
    const metadataPath = path.join(this.projectsDir, projectId, 'metadata.json');

    try {
      const content = await fs.readFile(metadataPath, 'utf-8');
      const metadata = JSON.parse(content);
      metadata.updatedAt = new Date().toISOString();

      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
    } catch {
      // Metadata file doesn't exist yet - that's okay
    }
  }

  /**
   * Get workflow file path
   * @param projectId - Project identifier
   * @returns Full path to workflow.json
   */
  private getWorkflowPath(projectId: string): string {
    return path.join(this.projectsDir, projectId, 'workflow.json');
  }

  /**
   * Get autosave file path
   * @param projectId - Project identifier
   * @returns Full path to workflow.autosave.json
   */
  private getAutosavePath(projectId: string): string {
    return path.join(this.projectsDir, projectId, 'workflow.autosave.json');
  }
}
