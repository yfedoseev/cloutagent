import { FlowCoordinatesFile, Project, WorkflowData } from '@cloutagent/types';

class APIClient {
  async listProjects(): Promise<Project[]> {
    const response = await fetch('/api/v1/projects');

    if (!response.ok) {
      throw new Error('Failed to fetch projects');
    }

    const data = await response.json();
    return data.projects;
  }

  async saveFlowCoordinates(
    projectId: string,
    coordinates: FlowCoordinatesFile,
  ): Promise<void> {
    const response = await fetch(
      `/api/v1/projects/${projectId}/flow-coordinates`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(coordinates),
      },
    );

    if (!response.ok) {
      throw new Error('Failed to save flow coordinates');
    }
  }

  async getFlowCoordinates(projectId: string): Promise<FlowCoordinatesFile> {
    const response = await fetch(
      `/api/v1/projects/${projectId}/flow-coordinates`,
    );

    if (!response.ok) {
      throw new Error('Failed to load flow coordinates');
    }

    return response.json();
  }

  /**
   * Save workflow to backend
   * @param projectId - Project identifier
   * @param workflow - Workflow data to save
   */
  async saveWorkflow(projectId: string, workflow: WorkflowData): Promise<void> {
    const response = await fetch(`/api/projects/${projectId}/workflow/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workflow),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save workflow');
    }
  }

  /**
   * Load workflow from backend
   * @param projectId - Project identifier
   * @returns Workflow data
   */
  async loadWorkflow(projectId: string): Promise<WorkflowData> {
    const response = await fetch(`/api/projects/${projectId}/workflow`);

    if (!response.ok) {
      throw new Error('Failed to load workflow');
    }

    const data = await response.json();
    return data.workflow;
  }

  /**
   * Autosave workflow in background (silent failure)
   * @param projectId - Project identifier
   * @param workflow - Workflow data to autosave
   */
  async autosaveWorkflow(
    projectId: string,
    workflow: WorkflowData,
  ): Promise<void> {
    // Silent autosave - don't throw on error
    try {
      await fetch(`/api/projects/${projectId}/workflow/autosave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workflow),
      });
    } catch {
      console.warn('Autosave failed');
    }
  }
}

export const apiClient = new APIClient();
