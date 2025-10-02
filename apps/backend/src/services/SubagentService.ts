import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import type {
  SubagentExecutionRequest,
  SubagentExecutionResponse,
  SubagentConfig,
} from '@cloutagent/types';

interface ClaudeSDKService {
  createAgent: (config: any) => any;
}

interface CostTracker {
  trackSubagent: (data: {
    subagentId: string;
    tokenUsage: { input: number; output: number };
    executionTime: number;
  }) => Promise<void>;
}

export class SubagentService {
  private readonly DEFAULT_TIMEOUT = 120000; // 120 seconds
  private readonly MAX_CONCURRENT = 10;

  private readonly SYSTEM_PROMPTS: Record<string, string> = {
    'frontend-engineer':
      'You are a frontend engineer with expertise in React, TypeScript, and modern web development. Build beautiful, responsive, and accessible user interfaces.',
    'backend-engineer':
      'You are a backend engineer with expertise in Node.js, APIs, databases, and server-side architecture. Build scalable, secure, and maintainable server-side systems.',
    'database-engineer':
      'You are a database engineer with expertise in SQL, NoSQL, schema design, and query optimization. Design efficient and scalable database solutions.',
    'ml-engineer':
      'You are a machine learning engineer with expertise in Python, TensorFlow, PyTorch, and data science. Build and deploy machine learning models.',
    'ui-ux-designer':
      'You are a UI/UX designer with expertise in design systems, user research, and interaction design. Create intuitive and delightful user experiences.',
    'software-engineer-test':
      'You are a software test engineer with expertise in testing frameworks, test automation, and quality assurance. Write comprehensive test suites.',
    'infrastructure-engineer':
      'You are an infrastructure engineer with expertise in cloud platforms, DevOps, and system reliability. Build scalable and resilient infrastructure.',
    'general-purpose':
      'You are a general-purpose AI assistant capable of helping with a wide range of tasks.',
  };

  constructor(
    private sdkService: ClaudeSDKService,
    private costTracker: CostTracker,
  ) {}

  async executeSubagent(
    request: SubagentExecutionRequest,
  ): Promise<SubagentExecutionResponse> {
    const startTime = Date.now();

    try {
      // Create specialized agent instance
      const agent = this.sdkService.createAgent({
        subagentType: request.type,
        systemPrompt: this.buildSystemPrompt(request),
      });

      // Execute with timeout
      const result = await this.executeWithTimeout(
        agent.run(request.prompt, request.context),
        request.timeout || this.DEFAULT_TIMEOUT,
      );

      const executionTime = Date.now() - startTime;

      // Track costs
      await this.costTracker.trackSubagent({
        subagentId: request.subagentId,
        tokenUsage: result.usage,
        executionTime,
      });

      return {
        subagentId: request.subagentId,
        result: result.output,
        executionTime,
        tokenUsage: result.usage,
        status: 'completed',
      };
    } catch (error: any) {
      return {
        subagentId: request.subagentId,
        result: '',
        executionTime: Date.now() - startTime,
        tokenUsage: { input: 0, output: 0 },
        status: 'failed',
        error: error.message,
      };
    }
  }

  async executeBatch(
    requests: SubagentExecutionRequest[],
  ): Promise<SubagentExecutionResponse[]> {
    // Execute in parallel with concurrency limit
    const results: SubagentExecutionResponse[] = [];

    for (let i = 0; i < requests.length; i += this.MAX_CONCURRENT) {
      const batch = requests.slice(i, i + this.MAX_CONCURRENT);
      const batchResults = await Promise.all(
        batch.map(req => this.executeSubagent(req)),
      );
      results.push(...batchResults);
    }

    return results;
  }

  private buildSystemPrompt(request: SubagentExecutionRequest): string {
    const type = request.type || 'general-purpose';
    return this.SYSTEM_PROMPTS[type] || this.SYSTEM_PROMPTS['general-purpose'];
  }

  private async executeWithTimeout<T>(
    promise: Promise<T>,
    timeout: number,
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout exceeded')), timeout),
      ),
    ]);
  }

  // Configuration Management Methods

  async createConfig(
    projectId: string,
    data: Omit<SubagentConfig, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<SubagentConfig> {
    // Validate type is valid subagent type
    const validTypes = [
      'frontend-engineer',
      'backend-engineer',
      'database-engineer',
      'ml-engineer',
      'ui-ux-designer',
      'software-engineer-test',
      'infrastructure-engineer',
      'general-purpose',
    ];

    if (!validTypes.includes(data.type)) {
      throw new Error(`Invalid subagent type: ${data.type}`);
    }

    const config: SubagentConfig = {
      id: randomUUID(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save to filesystem
    const configPath = path.join(
      process.cwd(),
      'projects',
      projectId,
      'subagents',
      `${config.id}.json`,
    );
    await fs.mkdir(path.dirname(configPath), { recursive: true });

    const tempPath = `${configPath}.tmp`;
    await fs.writeFile(tempPath, JSON.stringify(config, null, 2), 'utf-8');
    await fs.rename(tempPath, configPath);

    return config;
  }

  async listConfigs(projectId: string): Promise<SubagentConfig[]> {
    const subagentsDir = path.join(
      process.cwd(),
      'projects',
      projectId,
      'subagents',
    );

    try {
      const files = await fs.readdir(subagentsDir);
      const configs = await Promise.all(
        files
          .filter(f => f.endsWith('.json'))
          .map(async f => {
            const content = await fs.readFile(
              path.join(subagentsDir, f),
              'utf-8',
            );
            return JSON.parse(content) as SubagentConfig;
          }),
      );
      return configs;
    } catch (error: any) {
      if (error.code === 'ENOENT') return [];
      throw error;
    }
  }

  async getConfig(
    projectId: string,
    subagentId: string,
  ): Promise<SubagentConfig | null> {
    const configPath = path.join(
      process.cwd(),
      'projects',
      projectId,
      'subagents',
      `${subagentId}.json`,
    );

    try {
      const content = await fs.readFile(configPath, 'utf-8');
      return JSON.parse(content) as SubagentConfig;
    } catch (error: any) {
      if (error.code === 'ENOENT') return null;
      throw error;
    }
  }

  async updateConfig(
    projectId: string,
    subagentId: string,
    updates: Partial<SubagentConfig>,
  ): Promise<SubagentConfig> {
    const existing = await this.getConfig(projectId, subagentId);
    if (!existing) {
      throw new Error(`Subagent config not found: ${subagentId}`);
    }

    const updated: SubagentConfig = {
      ...existing,
      ...updates,
      id: existing.id, // Prevent ID change
      createdAt: existing.createdAt, // Prevent createdAt change
      updatedAt: new Date().toISOString(),
    };

    const configPath = path.join(
      process.cwd(),
      'projects',
      projectId,
      'subagents',
      `${subagentId}.json`,
    );
    const tempPath = `${configPath}.tmp`;
    await fs.writeFile(tempPath, JSON.stringify(updated, null, 2), 'utf-8');
    await fs.rename(tempPath, configPath);

    return updated;
  }

  async deleteConfig(projectId: string, subagentId: string): Promise<void> {
    const configPath = path.join(
      process.cwd(),
      'projects',
      projectId,
      'subagents',
      `${subagentId}.json`,
    );

    try {
      await fs.unlink(configPath);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }
}
