# Phase 6: Export/Import & Versioning - Execution Plan

**Timeline**: Weeks 11-12
**Focus**: Workflow Portability, Version Control, Collaboration
**Goal**: Enable workflow export/import, version tracking, and collaboration features

## Overview

Phase 6 implements workflow portability and version control:
- **Export/Import**: JSON-based workflow serialization for sharing and backup
- **Version Control**: Track changes, compare versions, rollback to previous states
- **Diff Visualization**: Visual comparison of workflow versions
- **Templates**: Reusable workflow templates and examples
- **Collaboration**: Share workflows, import community templates

## Interface Contracts

### IC-024: Export/Import Interface

**Purpose**: Serialize and deserialize workflows for portability

```typescript
// packages/types/src/export.ts

export interface WorkflowExport {
  version: string; // Export format version (e.g., "1.0.0")
  metadata: {
    name: string;
    description?: string;
    author?: string;
    createdAt: Date;
    exportedAt: Date;
    tags?: string[];
  };
  workflow: {
    nodes: Node[];
    edges: Edge[];
    variables: Variable[];
    secrets: SecretReference[]; // Only references, not actual values
  };
  configuration: {
    environment?: Record<string, string>; // Env vars (no secrets)
    dependencies?: string[]; // Required MCP servers
  };
}

export interface SecretReference {
  id: string;
  name: string;
  type: string;
  description?: string;
  // Actual value not exported for security
}

export interface ImportOptions {
  overwriteExisting: boolean;
  importVariables: boolean;
  importSecrets: boolean; // Create placeholder secrets
  renameConflicts: boolean;
}

export interface ImportResult {
  success: boolean;
  projectId: string;
  warnings: string[];
  errors: string[];
  mapping: {
    nodes: Record<string, string>; // Old ID -> New ID
    variables: Record<string, string>;
    secrets: Record<string, string>;
  };
}

export interface ExportOptions {
  includeVariables: boolean;
  includeSecrets: boolean; // Export as references only
  includeHistory: boolean;
  format: 'json' | 'yaml';
  minify: boolean;
}
```

**API Endpoints**:
```typescript
// POST /api/projects/{projectId}/export
// Body: ExportOptions
// Response: WorkflowExport (JSON)

// POST /api/projects/import
// Body: { workflow: WorkflowExport, options: ImportOptions }
// Response: ImportResult

// GET /api/projects/{projectId}/export/download
// Query: ?format=json
// Response: File download
```

---

### IC-025: Version Control Interface

**Purpose**: Track workflow changes and enable version management

```typescript
// packages/types/src/versioning.ts

export interface WorkflowVersion {
  id: string;
  projectId: string;
  versionNumber: number;
  tag?: string; // e.g., "v1.0.0", "stable", "production"
  message: string; // Commit message
  author?: string;
  createdAt: Date;
  snapshot: WorkflowSnapshot;
  parentVersionId?: string; // For branching
}

export interface WorkflowSnapshot {
  nodes: Node[];
  edges: Edge[];
  variables: Variable[];
  secrets: SecretReference[];
  configuration: Record<string, any>;
  checksum: string; // SHA-256 of content for integrity
}

export interface VersionDiff {
  fromVersion: number;
  toVersion: number;
  changes: {
    nodesAdded: Node[];
    nodesRemoved: Node[];
    nodesModified: NodeDiff[];
    edgesAdded: Edge[];
    edgesRemoved: Edge[];
    variablesChanged: VariableDiff[];
  };
  summary: {
    totalChanges: number;
    breakingChanges: boolean; // If changes might break existing executions
  };
}

export interface NodeDiff {
  nodeId: string;
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
}

export interface VariableDiff {
  variableId: string;
  changeType: 'added' | 'removed' | 'modified';
  oldValue?: any;
  newValue?: any;
}

export interface RollbackOptions {
  targetVersion: number;
  createNewVersion: boolean; // Create new version or revert to exact state
  preserveVariables: boolean; // Keep current variables
  preserveSecrets: boolean;
}
```

**API Endpoints**:
```typescript
// POST /api/projects/{projectId}/versions
// Body: { message: string, tag?: string }
// Response: WorkflowVersion

// GET /api/projects/{projectId}/versions
// Response: { versions: WorkflowVersion[] }

// GET /api/projects/{projectId}/versions/{versionId}
// Response: WorkflowVersion

// GET /api/projects/{projectId}/versions/compare
// Query: ?from=1&to=2
// Response: VersionDiff

// POST /api/projects/{projectId}/versions/{versionId}/rollback
// Body: RollbackOptions
// Response: WorkflowVersion (new version created after rollback)

// POST /api/projects/{projectId}/versions/{versionId}/tag
// Body: { tag: string }
// Response: WorkflowVersion
```

---

### IC-026: Template Management Interface

**Purpose**: Create and share reusable workflow templates

```typescript
// packages/types/src/templates.ts

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'automation' | 'data-processing' | 'analysis' | 'integration' | 'custom';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  author: {
    name: string;
    email?: string;
    url?: string;
  };
  thumbnail?: string; // Base64 or URL
  workflow: WorkflowExport;
  requiredVariables: VariableDefinition[];
  requiredSecrets: SecretReference[];
  usage: {
    installs: number;
    rating?: number;
  };
  version: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateFilter {
  category?: string;
  difficulty?: string;
  tags?: string[];
  search?: string;
}

export interface TemplateInstallOptions {
  projectName: string;
  autoConfigureVariables: boolean;
  autoConfigureSecrets: boolean;
}
```

**API Endpoints**:
```typescript
// GET /api/templates
// Query: ?category=automation&difficulty=beginner&search=data
// Response: { templates: WorkflowTemplate[] }

// GET /api/templates/{templateId}
// Response: WorkflowTemplate

// POST /api/templates/{templateId}/install
// Body: TemplateInstallOptions
// Response: ImportResult

// POST /api/projects/{projectId}/create-template
// Body: { name: string, description: string, category: string }
// Response: WorkflowTemplate
```

---

## Tasks

### TASK-043: Export Service

**Agent**: backend-engineer
**Priority**: P0
**Estimated Time**: 4 hours
**Dependencies**: TASK-001 (File Storage), IC-024

**Description**: Implement workflow export to JSON/YAML with configurable options.

**Implementation Skeleton**:
```typescript
// apps/backend/src/services/ExportService.ts

import { promises as fs } from 'fs';
import crypto from 'crypto';
import {
  WorkflowExport,
  ExportOptions,
  WorkflowGraph,
  Variable,
  Secret,
} from '@cloutagent/types';

export class ExportService {
  async exportWorkflow(
    projectId: string,
    workflow: WorkflowGraph,
    options: ExportOptions
  ): Promise<WorkflowExport> {
    const project = await this.loadProject(projectId);

    const exportData: WorkflowExport = {
      version: '1.0.0',
      metadata: {
        name: project.name,
        description: project.description,
        author: project.author,
        createdAt: project.createdAt,
        exportedAt: new Date(),
        tags: project.tags,
      },
      workflow: {
        nodes: this.sanitizeNodes(workflow.nodes),
        edges: workflow.edges,
        variables: options.includeVariables
          ? await this.loadVariables(projectId)
          : [],
        secrets: options.includeSecrets
          ? await this.loadSecretReferences(projectId)
          : [],
      },
      configuration: {
        environment: await this.loadEnvironmentVariables(projectId),
        dependencies: this.extractDependencies(workflow),
      },
    };

    if (options.format === 'yaml') {
      // Convert to YAML (requires yaml library)
      return exportData; // Would convert to YAML string
    }

    if (options.minify) {
      return JSON.parse(JSON.stringify(exportData)); // Minified
    }

    return exportData;
  }

  async exportToFile(
    projectId: string,
    workflow: WorkflowGraph,
    options: ExportOptions
  ): Promise<string> {
    const exportData = await this.exportWorkflow(projectId, workflow, options);

    const filename = `${projectId}-${Date.now()}.json`;
    const filepath = `./exports/${filename}`;

    await fs.mkdir('./exports', { recursive: true });

    if (options.format === 'json') {
      await fs.writeFile(
        filepath,
        JSON.stringify(exportData, null, options.minify ? 0 : 2),
        'utf-8'
      );
    }

    return filepath;
  }

  private sanitizeNodes(nodes: Node[]): Node[] {
    // Remove runtime-only data
    return nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        status: undefined, // Remove execution status
        lastExecution: undefined,
      },
    }));
  }

  private async loadSecretReferences(projectId: string): Promise<SecretReference[]> {
    const secrets = await this.loadSecrets(projectId);

    // Return only references, never actual values
    return secrets.map(secret => ({
      id: secret.id,
      name: secret.name,
      type: secret.type,
      description: secret.description,
    }));
  }

  private extractDependencies(workflow: WorkflowGraph): string[] {
    const mcpNodes = workflow.nodes.filter(n => n.type === 'mcp');

    return mcpNodes.map(node => node.data.config.server.command);
  }

  private async loadProject(projectId: string): Promise<any> {
    // Load project metadata
    return {};
  }

  private async loadVariables(projectId: string): Promise<Variable[]> {
    // Load from VariableService
    return [];
  }

  private async loadSecrets(projectId: string): Promise<Secret[]> {
    // Load from SecretManager
    return [];
  }

  private async loadEnvironmentVariables(projectId: string): Promise<Record<string, string>> {
    // Load env vars (excluding secrets)
    return {};
  }
}
```

**Acceptance Criteria**:
- [ ] Export to JSON format
- [ ] Secret values never exported (only references)
- [ ] Variable values included when option enabled
- [ ] MCP dependencies extracted automatically
- [ ] Minify option removes whitespace
- [ ] Export includes metadata (name, author, timestamp)
- [ ] Generated JSON is valid and parseable

**Test Cases**:
```typescript
describe('ExportService', () => {
  it('should export workflow to JSON', async () => {
    const options: ExportOptions = {
      includeVariables: true,
      includeSecrets: true,
      includeHistory: false,
      format: 'json',
      minify: false,
    };

    const exported = await service.exportWorkflow('proj-001', workflow, options);

    expect(exported.version).toBe('1.0.0');
    expect(exported.workflow.nodes).toHaveLength(3);
    expect(exported.workflow.secrets[0].value).toBeUndefined(); // Never export secret values
  });
});
```

---

### TASK-044: Import Service

**Agent**: backend-engineer
**Priority**: P0
**Estimated Time**: 5 hours
**Dependencies**: TASK-043 (Export Service), IC-024

**Description**: Implement workflow import with conflict resolution and ID remapping.

**Implementation Skeleton**:
```typescript
// apps/backend/src/services/ImportService.ts

import {
  WorkflowExport,
  ImportOptions,
  ImportResult,
  WorkflowGraph,
} from '@cloutagent/types';
import { ProjectStorage } from './ProjectStorage';

export class ImportService {
  constructor(
    private projectStorage: ProjectStorage,
    private variableService: VariableService,
    private secretManager: SecretManager
  ) {}

  async importWorkflow(
    workflowData: WorkflowExport,
    options: ImportOptions
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      projectId: '',
      warnings: [],
      errors: [],
      mapping: {
        nodes: {},
        variables: {},
        secrets: {},
      },
    };

    try {
      // Step 1: Validate export format
      this.validateExportFormat(workflowData);

      // Step 2: Check for conflicts
      const conflicts = await this.detectConflicts(workflowData, options);

      if (conflicts.length > 0 && !options.overwriteExisting) {
        result.errors.push('Conflicts detected and overwrite not enabled');
        return result;
      }

      // Step 3: Create new project
      const project = await this.projectStorage.create({
        name: workflowData.metadata.name,
        description: workflowData.metadata.description,
      });

      result.projectId = project.id;

      // Step 4: Remap IDs to avoid conflicts
      const remappedWorkflow = this.remapIds(workflowData.workflow);

      // Step 5: Import nodes and edges
      await this.importNodes(project.id, remappedWorkflow.nodes);
      await this.importEdges(project.id, remappedWorkflow.edges);

      // Step 6: Import variables (if enabled)
      if (options.importVariables && workflowData.workflow.variables) {
        for (const variable of workflowData.workflow.variables) {
          const newVar = await this.variableService.createVariable(project.id, variable);
          result.mapping.variables[variable.id] = newVar.id;
        }
      }

      // Step 7: Import secrets (create placeholders)
      if (options.importSecrets && workflowData.workflow.secrets) {
        for (const secretRef of workflowData.workflow.secrets) {
          const newSecret = await this.secretManager.createSecret(project.id, {
            name: secretRef.name,
            value: '*** PLACEHOLDER - PLEASE UPDATE ***',
            type: secretRef.type,
          });

          result.mapping.secrets[secretRef.id] = newSecret.id;
          result.warnings.push(
            `Secret "${secretRef.name}" created as placeholder - please update with actual value`
          );
        }
      }

      // Step 8: Validate dependencies
      const missingDeps = await this.checkDependencies(
        workflowData.configuration.dependencies
      );

      if (missingDeps.length > 0) {
        result.warnings.push(
          `Missing dependencies: ${missingDeps.join(', ')}`
        );
      }

      result.success = true;

      return result;
    } catch (error) {
      result.errors.push(error.message);
      return result;
    }
  }

  private validateExportFormat(workflowData: WorkflowExport): void {
    if (!workflowData.version) {
      throw new Error('Invalid export format: missing version');
    }

    if (!workflowData.workflow || !workflowData.workflow.nodes) {
      throw new Error('Invalid export format: missing workflow data');
    }

    // Check version compatibility
    const [major] = workflowData.version.split('.');
    if (major !== '1') {
      throw new Error(`Unsupported export version: ${workflowData.version}`);
    }
  }

  private async detectConflicts(
    workflowData: WorkflowExport,
    options: ImportOptions
  ): Promise<string[]> {
    // Check for naming conflicts
    const conflicts: string[] = [];

    const existingProjects = await this.projectStorage.list();
    const nameExists = existingProjects.some(
      p => p.name === workflowData.metadata.name
    );

    if (nameExists && !options.renameConflicts) {
      conflicts.push(`Project with name "${workflowData.metadata.name}" already exists`);
    }

    return conflicts;
  }

  private remapIds(workflow: WorkflowGraph): WorkflowGraph {
    const nodeIdMap = new Map<string, string>();

    // Generate new IDs for all nodes
    const remappedNodes = workflow.nodes.map(node => {
      const newId = this.generateId();
      nodeIdMap.set(node.id, newId);

      return {
        ...node,
        id: newId,
      };
    });

    // Update edge references
    const remappedEdges = workflow.edges.map(edge => ({
      ...edge,
      id: this.generateId(),
      source: nodeIdMap.get(edge.source) || edge.source,
      target: nodeIdMap.get(edge.target) || edge.target,
    }));

    return {
      ...workflow,
      nodes: remappedNodes,
      edges: remappedEdges,
    };
  }

  private async importNodes(projectId: string, nodes: Node[]): Promise<void> {
    // Save nodes to project
  }

  private async importEdges(projectId: string, edges: Edge[]): Promise<void> {
    // Save edges to project
  }

  private async checkDependencies(dependencies?: string[]): Promise<string[]> {
    if (!dependencies) return [];

    // Check which MCP servers are missing
    const missing: string[] = [];

    // ... dependency checking logic ...

    return missing;
  }

  private generateId(): string {
    return `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

**Acceptance Criteria**:
- [ ] Import creates new project
- [ ] Node and edge IDs remapped to avoid conflicts
- [ ] Variables imported when option enabled
- [ ] Secrets created as placeholders with warnings
- [ ] Dependencies validated
- [ ] Errors and warnings reported clearly
- [ ] Rollback on import failure

**Test Cases**:
```typescript
describe('ImportService', () => {
  it('should import workflow successfully', async () => {
    const options: ImportOptions = {
      overwriteExisting: false,
      importVariables: true,
      importSecrets: true,
      renameConflicts: true,
    };

    const result = await service.importWorkflow(exportedWorkflow, options);

    expect(result.success).toBe(true);
    expect(result.projectId).toBeTruthy();
    expect(result.mapping.nodes).toBeDefined();
  });

  it('should create placeholder secrets', async () => {
    const result = await service.importWorkflow(exportedWorkflow, options);

    expect(result.warnings).toContain(
      expect.stringContaining('placeholder')
    );
  });
});
```

---

### TASK-045: Version Control Service

**Agent**: backend-engineer
**Priority**: P1
**Estimated Time**: 6 hours
**Dependencies**: TASK-001 (File Storage), IC-025

**Description**: Implement version tracking, diff generation, and rollback.

**Implementation Skeleton**:
```typescript
// apps/backend/src/services/VersionControlService.ts

import crypto from 'crypto';
import {
  WorkflowVersion,
  WorkflowSnapshot,
  VersionDiff,
  RollbackOptions,
} from '@cloutagent/types';

export class VersionControlService {
  async createVersion(
    projectId: string,
    workflow: WorkflowGraph,
    message: string,
    tag?: string
  ): Promise<WorkflowVersion> {
    const versions = await this.listVersions(projectId);
    const latestVersion = versions[versions.length - 1];

    const snapshot = await this.createSnapshot(workflow);

    const version: WorkflowVersion = {
      id: this.generateVersionId(),
      projectId,
      versionNumber: (latestVersion?.versionNumber || 0) + 1,
      tag,
      message,
      createdAt: new Date(),
      snapshot,
      parentVersionId: latestVersion?.id,
    };

    await this.saveVersion(projectId, version);

    return version;
  }

  async compareVersions(
    projectId: string,
    fromVersion: number,
    toVersion: number
  ): Promise<VersionDiff> {
    const versions = await this.listVersions(projectId);

    const from = versions.find(v => v.versionNumber === fromVersion);
    const to = versions.find(v => v.versionNumber === toVersion);

    if (!from || !to) {
      throw new Error('Version not found');
    }

    const diff: VersionDiff = {
      fromVersion,
      toVersion,
      changes: {
        nodesAdded: [],
        nodesRemoved: [],
        nodesModified: [],
        edgesAdded: [],
        edgesRemoved: [],
        variablesChanged: [],
      },
      summary: {
        totalChanges: 0,
        breakingChanges: false,
      },
    };

    // Detect node changes
    const fromNodeIds = new Set(from.snapshot.nodes.map(n => n.id));
    const toNodeIds = new Set(to.snapshot.nodes.map(n => n.id));

    // Nodes added
    diff.changes.nodesAdded = to.snapshot.nodes.filter(
      n => !fromNodeIds.has(n.id)
    );

    // Nodes removed
    diff.changes.nodesRemoved = from.snapshot.nodes.filter(
      n => !toNodeIds.has(n.id)
    );

    // Nodes modified
    for (const toNode of to.snapshot.nodes) {
      const fromNode = from.snapshot.nodes.find(n => n.id === toNode.id);

      if (fromNode && !this.deepEqual(fromNode, toNode)) {
        diff.changes.nodesModified.push({
          nodeId: toNode.id,
          changes: this.getNodeChanges(fromNode, toNode),
        });
      }
    }

    // Detect edge changes (similar logic)

    // Calculate summary
    diff.summary.totalChanges =
      diff.changes.nodesAdded.length +
      diff.changes.nodesRemoved.length +
      diff.changes.nodesModified.length +
      diff.changes.edgesAdded.length +
      diff.changes.edgesRemoved.length;

    // Determine if breaking changes
    diff.summary.breakingChanges =
      diff.changes.nodesRemoved.length > 0 ||
      diff.changes.edgesRemoved.length > 0;

    return diff;
  }

  async rollback(
    projectId: string,
    options: RollbackOptions
  ): Promise<WorkflowVersion> {
    const versions = await this.listVersions(projectId);
    const targetVersion = versions.find(
      v => v.versionNumber === options.targetVersion
    );

    if (!targetVersion) {
      throw new Error('Target version not found');
    }

    // Restore workflow to target version state
    const restoredWorkflow: WorkflowGraph = {
      nodes: targetVersion.snapshot.nodes,
      edges: targetVersion.snapshot.edges,
      projectId,
    };

    // Save current state first (create rollback checkpoint)
    const currentWorkflow = await this.loadCurrentWorkflow(projectId);
    await this.createVersion(
      projectId,
      currentWorkflow,
      `Checkpoint before rollback to v${options.targetVersion}`
    );

    // Apply rollback
    await this.saveWorkflow(projectId, restoredWorkflow);

    // Create new version if requested
    if (options.createNewVersion) {
      return this.createVersion(
        projectId,
        restoredWorkflow,
        `Rolled back to version ${options.targetVersion}`
      );
    }

    return targetVersion;
  }

  private async createSnapshot(workflow: WorkflowGraph): Promise<WorkflowSnapshot> {
    const snapshot: WorkflowSnapshot = {
      nodes: workflow.nodes,
      edges: workflow.edges,
      variables: await this.loadVariables(workflow.projectId),
      secrets: await this.loadSecretReferences(workflow.projectId),
      configuration: {},
      checksum: '',
    };

    // Calculate checksum
    snapshot.checksum = this.calculateChecksum(snapshot);

    return snapshot;
  }

  private calculateChecksum(snapshot: WorkflowSnapshot): string {
    const content = JSON.stringify({
      nodes: snapshot.nodes,
      edges: snapshot.edges,
      variables: snapshot.variables,
    });

    return crypto.createHash('sha256').update(content).digest('hex');
  }

  private deepEqual(obj1: any, obj2: any): boolean {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
  }

  private getNodeChanges(fromNode: Node, toNode: Node): any[] {
    const changes: any[] = [];

    // Compare all fields
    Object.keys(toNode).forEach(key => {
      if (!this.deepEqual(fromNode[key], toNode[key])) {
        changes.push({
          field: key,
          oldValue: fromNode[key],
          newValue: toNode[key],
        });
      }
    });

    return changes;
  }

  private async saveVersion(
    projectId: string,
    version: WorkflowVersion
  ): Promise<void> {
    // Save to filesystem
  }

  private async listVersions(projectId: string): Promise<WorkflowVersion[]> {
    // Load from filesystem
    return [];
  }

  private async loadCurrentWorkflow(projectId: string): Promise<WorkflowGraph> {
    return {} as WorkflowGraph;
  }

  private async saveWorkflow(
    projectId: string,
    workflow: WorkflowGraph
  ): Promise<void> {
    // Save workflow
  }

  private async loadVariables(projectId: string): Promise<any[]> {
    return [];
  }

  private async loadSecretReferences(projectId: string): Promise<any[]> {
    return [];
  }

  private generateVersionId(): string {
    return `ver-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

**Acceptance Criteria**:
- [ ] Versions created with incremental numbers
- [ ] Snapshots include nodes, edges, variables, secrets
- [ ] Diff detects added, removed, modified nodes/edges
- [ ] Breaking changes detected (removed nodes/edges)
- [ ] Rollback creates checkpoint before reverting
- [ ] Checksum validates snapshot integrity
- [ ] Tag support for marking stable versions

---

### TASK-046: Export/Import UI

**Agent**: frontend-engineer
**Priority**: P1
**Estimated Time**: 4 hours
**Dependencies**: TASK-043, TASK-044, IC-024

**Description**: Create UI for exporting and importing workflows.

**Implementation Skeleton**:
```typescript
// apps/frontend/src/components/ExportImportPanel.tsx

import { useState } from 'react';
import { ExportOptions, ImportOptions, WorkflowExport } from '@cloutagent/types';

export function ExportImportPanel({ projectId }: { projectId: string }) {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includeVariables: true,
    includeSecrets: true,
    includeHistory: false,
    format: 'json',
    minify: false,
  });

  const handleExport = async () => {
    const response = await fetch(`/api/projects/${projectId}/export/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(exportOptions),
    });

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workflow-${projectId}-${Date.now()}.json`;
    a.click();
  };

  const handleImport = async (file: File) => {
    const content = await file.text();
    const workflowData: WorkflowExport = JSON.parse(content);

    const response = await fetch('/api/projects/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workflow: workflowData,
        options: {
          overwriteExisting: false,
          importVariables: true,
          importSecrets: true,
          renameConflicts: true,
        },
      }),
    });

    const result = await response.json();

    if (result.success) {
      alert(`Workflow imported successfully! Project ID: ${result.projectId}`);
      window.location.href = `/projects/${result.projectId}`;
    } else {
      alert(`Import failed: ${result.errors.join(', ')}`);
    }
  };

  return (
    <div className="p-4 bg-gray-900 text-white">
      <h2 className="text-xl font-bold mb-4">Export / Import</h2>

      {/* Export Section */}
      <div className="mb-6 p-4 bg-gray-800 rounded">
        <h3 className="font-semibold mb-3">Export Workflow</h3>

        <div className="space-y-2 mb-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={exportOptions.includeVariables}
              onChange={e =>
                setExportOptions({ ...exportOptions, includeVariables: e.target.checked })
              }
            />
            <span className="text-sm">Include variables</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={exportOptions.includeSecrets}
              onChange={e =>
                setExportOptions({ ...exportOptions, includeSecrets: e.target.checked })
              }
            />
            <span className="text-sm">Include secrets (references only)</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={exportOptions.minify}
              onChange={e =>
                setExportOptions({ ...exportOptions, minify: e.target.checked })
              }
            />
            <span className="text-sm">Minify JSON</span>
          </label>
        </div>

        <button
          onClick={handleExport}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium"
        >
          📥 Download Workflow
        </button>
      </div>

      {/* Import Section */}
      <div className="p-4 bg-gray-800 rounded">
        <h3 className="font-semibold mb-3">Import Workflow</h3>

        <input
          type="file"
          accept=".json"
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) handleImport(file);
          }}
          className="block w-full text-sm text-gray-400
            file:mr-4 file:py-2 file:px-4
            file:rounded file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-600 file:text-white
            hover:file:bg-blue-700"
        />

        <p className="text-xs text-gray-400 mt-2">
          Select a workflow JSON file to import
        </p>
      </div>
    </div>
  );
}
```

**Acceptance Criteria**:
- [ ] Export downloads JSON file
- [ ] Export options configurable
- [ ] Import reads JSON file
- [ ] Import shows success/error messages
- [ ] Warnings displayed for placeholder secrets
- [ ] File validation before import

---

### TASK-047: Version History UI

**Agent**: frontend-engineer
**Priority**: P1
**Estimated Time**: 5 hours
**Dependencies**: TASK-045 (Version Control Service), IC-025

**Description**: Create version history viewer with diff visualization.

**Implementation Skeleton**:
```typescript
// apps/frontend/src/components/VersionHistory.tsx

import { useState, useEffect } from 'react';
import { WorkflowVersion, VersionDiff } from '@cloutagent/types';

export function VersionHistory({ projectId }: { projectId: string }) {
  const [versions, setVersions] = useState<WorkflowVersion[]>([]);
  const [selectedDiff, setSelectedDiff] = useState<VersionDiff | null>(null);

  useEffect(() => {
    loadVersions();
  }, [projectId]);

  const loadVersions = async () => {
    const response = await fetch(`/api/projects/${projectId}/versions`);
    const data = await response.json();
    setVersions(data.versions);
  };

  const handleCompare = async (fromVersion: number, toVersion: number) => {
    const response = await fetch(
      `/api/projects/${projectId}/versions/compare?from=${fromVersion}&to=${toVersion}`
    );
    const diff = await response.json();
    setSelectedDiff(diff);
  };

  const handleRollback = async (versionNumber: number) => {
    if (!confirm(`Rollback to version ${versionNumber}?`)) return;

    await fetch(`/api/projects/${projectId}/versions/${versionNumber}/rollback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        createNewVersion: true,
        preserveVariables: true,
        preserveSecrets: true,
      }),
    });

    alert('Rollback complete!');
    window.location.reload();
  };

  return (
    <div className="p-4 bg-gray-900 text-white">
      <h2 className="text-xl font-bold mb-4">Version History</h2>

      <div className="space-y-2">
        {versions.map(version => (
          <div
            key={version.id}
            className="p-3 bg-gray-800 rounded border border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm text-gray-400">
                  v{version.versionNumber}
                </span>

                {version.tag && (
                  <span className="px-2 py-1 bg-blue-600 rounded text-xs">
                    {version.tag}
                  </span>
                )}

                <span className="text-sm">{version.message}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    handleCompare(version.versionNumber - 1, version.versionNumber)
                  }
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
                >
                  📊 Diff
                </button>

                <button
                  onClick={() => handleRollback(version.versionNumber)}
                  className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-sm"
                >
                  ⏮️ Rollback
                </button>
              </div>
            </div>

            <div className="text-xs text-gray-400 mt-2">
              {new Date(version.createdAt).toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* Diff Viewer */}
      {selectedDiff && (
        <DiffViewer diff={selectedDiff} onClose={() => setSelectedDiff(null)} />
      )}
    </div>
  );
}

function DiffViewer({ diff, onClose }: { diff: VersionDiff; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-3/4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">
            Changes: v{diff.fromVersion} → v{diff.toVersion}
          </h3>

          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>

        {/* Summary */}
        <div className="mb-4 p-3 bg-gray-700 rounded">
          <div className="text-sm">
            Total changes: {diff.summary.totalChanges}
          </div>
          {diff.summary.breakingChanges && (
            <div className="text-sm text-red-400 mt-1">
              ⚠️ Contains breaking changes
            </div>
          )}
        </div>

        {/* Changes */}
        <div className="space-y-4">
          {diff.changes.nodesAdded.length > 0 && (
            <div>
              <h4 className="font-semibold text-green-400 mb-2">
                ➕ Nodes Added ({diff.changes.nodesAdded.length})
              </h4>
              <div className="space-y-1">
                {diff.changes.nodesAdded.map(node => (
                  <div key={node.id} className="text-sm text-green-300">
                    + {node.type}: {node.data.config?.name || node.id}
                  </div>
                ))}
              </div>
            </div>
          )}

          {diff.changes.nodesRemoved.length > 0 && (
            <div>
              <h4 className="font-semibold text-red-400 mb-2">
                ➖ Nodes Removed ({diff.changes.nodesRemoved.length})
              </h4>
              <div className="space-y-1">
                {diff.changes.nodesRemoved.map(node => (
                  <div key={node.id} className="text-sm text-red-300">
                    - {node.type}: {node.data.config?.name || node.id}
                  </div>
                ))}
              </div>
            </div>
          )}

          {diff.changes.nodesModified.length > 0 && (
            <div>
              <h4 className="font-semibold text-yellow-400 mb-2">
                📝 Nodes Modified ({diff.changes.nodesModified.length})
              </h4>
              <div className="space-y-2">
                {diff.changes.nodesModified.map(nodeDiff => (
                  <div key={nodeDiff.nodeId} className="text-sm">
                    <div className="font-semibold text-yellow-300">
                      {nodeDiff.nodeId}
                    </div>
                    {nodeDiff.changes.map((change, i) => (
                      <div key={i} className="ml-4 text-gray-400">
                        {change.field}: {JSON.stringify(change.oldValue)} →{' '}
                        {JSON.stringify(change.newValue)}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

**Acceptance Criteria**:
- [ ] Version list displayed chronologically
- [ ] Tags shown for marked versions
- [ ] Diff viewer shows added/removed/modified nodes
- [ ] Rollback with confirmation dialog
- [ ] Breaking changes highlighted
- [ ] Responsive diff visualization

---

## Testing Strategy

### Unit Tests
- Export/import format validation
- ID remapping logic
- Version diff calculation
- Checksum generation

### Integration Tests
- Full export/import round-trip
- Version creation and rollback
- Conflict detection

### E2E Tests
- Export workflow, import to new project
- Create versions, compare diffs
- Rollback to previous version

## Success Metrics

- [ ] Export/import preserves workflow integrity
- [ ] Version diffs accurate (100% change detection)
- [ ] Rollback successfully reverts changes
- [ ] Secrets never leaked in exports
- [ ] Import handles conflicts gracefully

## Dependencies

### External Libraries
- None (native JSON serialization)

### Phase Dependencies
- Phase 1: File storage, secret manager
- Phase 2: Workflow canvas
- Phase 5: Variable management

## Rollout Plan

1. **Week 11 Days 1-3**: Backend services (TASK-043, TASK-044, TASK-045)
2. **Week 11 Days 4-5**: Frontend UI (TASK-046, TASK-047)
3. **Week 12**: Template system, testing, documentation

## Notes

- **Security**: Secret values NEVER exported
- **Compatibility**: Version format should be forward-compatible
- **Performance**: Large workflows may need streaming export
- **UX**: Clear warnings for missing dependencies on import
