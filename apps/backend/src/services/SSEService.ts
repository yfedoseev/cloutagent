import { Response } from 'express';
import { SSEEvent, SSEEventType } from '@cloutagent/types';
import { EventEmitter } from 'events';

export class SSEService {
  private clients = new Map<string, Set<Response>>();

  constructor(private executionEngine: EventEmitter) {
    this.setupEngineListeners();
  }

  subscribe(executionId: string, res: Response): void {
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Send initial connection event
    this.sendEvent(res, {
      type: 'connection:established' as SSEEventType,
      timestamp: new Date(),
      executionId,
      data: { message: 'Connected to execution stream' },
    });

    // Track client
    if (!this.clients.has(executionId)) {
      this.clients.set(executionId, new Set());
    }
    this.clients.get(executionId)!.add(res);

    // Handle client disconnect
    res.on('close', () => {
      this.unsubscribe(executionId, res);
    });
  }

  unsubscribe(executionId: string, res: Response): void {
    const clients = this.clients.get(executionId);
    if (clients) {
      clients.delete(res);

      // Cleanup if no clients remain
      if (clients.size === 0) {
        this.clients.delete(executionId);
      }
    }
  }

  private setupEngineListeners(): void {
    // Execution started
    this.executionEngine.on('execution:started', (data) => {
      this.broadcast(data.execution.id, {
        type: 'execution:started',
        timestamp: new Date(),
        executionId: data.execution.id,
        data,
      });
    });

    // Execution step
    this.executionEngine.on('execution:step', (data) => {
      const executionId = data.executionId || data.step?.executionId;
      if (executionId) {
        this.broadcast(executionId, {
          type: 'execution:step',
          timestamp: new Date(),
          executionId,
          data,
        });
      }
    });

    // Execution output (streaming chunks)
    this.executionEngine.on('execution:output', (data) => {
      this.broadcast(data.executionId, {
        type: 'execution:output',
        timestamp: new Date(),
        executionId: data.executionId,
        data,
      });
    });

    // Token usage updates
    this.executionEngine.on('execution:token-usage', (data) => {
      const executionId = data.executionId || data.nodeId;
      if (executionId) {
        this.broadcast(executionId, {
          type: 'execution:token-usage',
          timestamp: new Date(),
          executionId,
          data,
        });
      }
    });

    // Execution completed
    this.executionEngine.on('execution:completed', (data) => {
      this.broadcast(data.execution.id, {
        type: 'execution:completed',
        timestamp: new Date(),
        executionId: data.execution.id,
        data,
      });
    });

    // Execution failed
    this.executionEngine.on('execution:failed', (data) => {
      this.broadcast(data.execution.id, {
        type: 'execution:failed',
        timestamp: new Date(),
        executionId: data.execution.id,
        data,
      });
    });

    // Execution paused
    this.executionEngine.on('execution:paused', (data) => {
      this.broadcast(data.executionId, {
        type: 'execution:paused',
        timestamp: new Date(),
        executionId: data.executionId,
        data,
      });
    });

    // Execution resumed
    this.executionEngine.on('execution:resumed', (data) => {
      this.broadcast(data.executionId, {
        type: 'execution:resumed',
        timestamp: new Date(),
        executionId: data.executionId,
        data,
      });
    });

    // Execution cancelled
    this.executionEngine.on('execution:cancelled', (data) => {
      this.broadcast(data.executionId, {
        type: 'execution:cancelled',
        timestamp: new Date(),
        executionId: data.executionId,
        data,
      });
    });
  }

  private broadcast(executionId: string, event: SSEEvent): void {
    const clients = this.clients.get(executionId);
    if (!clients) return;

    clients.forEach((res) => {
      this.sendEvent(res, event);
    });
  }

  private sendEvent(res: Response, event: SSEEvent): void {
    // SSE format:
    // event: {type}
    // data: {json}
    // id: {timestamp}
    // \n\n

    const formattedEvent = [
      `event: ${event.type}`,
      `data: ${JSON.stringify(event.data)}`,
      `id: ${Date.now()}`,
      '',
      '',
    ].join('\n');

    res.write(formattedEvent);
  }

  // Utility methods for testing
  getClientCount(executionId: string): number {
    return this.clients.get(executionId)?.size || 0;
  }

  hasExecution(executionId: string): boolean {
    return this.clients.has(executionId);
  }
}
