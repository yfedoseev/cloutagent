import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { EventEmitter } from 'events';
import { SSEService } from './SSEService';
import type { Response } from 'express';

// Mock Express Response
class MockResponse {
  public headers: Record<string, string> = {};
  public writtenData: string[] = [];
  public closed = false;
  private listeners: Record<string, (() => void)[]> = {};
  public setHeader = vi.fn((name: string, value: string) => {
    this.headers[name] = value;
  });
  public write = vi.fn((data: string) => {
    this.writtenData.push(data);
  });

  on(event: string, handler: () => void): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(handler);
  }

  emit(event: string): void {
    if (this.listeners[event]) {
      this.listeners[event].forEach((handler) => handler());
    }
  }

  simulateClose(): void {
    this.closed = true;
    this.emit('close');
  }
}

describe('SSEService', () => {
  let service: SSEService;
  let mockEngine: EventEmitter;

  beforeEach(() => {
    mockEngine = new EventEmitter();
    service = new SSEService(mockEngine);
  });

  afterEach(() => {
    mockEngine.removeAllListeners();
  });

  describe('subscribe', () => {
    it('should set SSE headers on response', () => {
      const mockRes = new MockResponse() as unknown as Response;
      const executionId = 'exec-123';

      service.subscribe(executionId, mockRes);

      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'text/event-stream',
      );
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Cache-Control',
        'no-cache',
      );
      expect(mockRes.setHeader).toHaveBeenCalledWith('Connection', 'keep-alive');
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'X-Accel-Buffering',
        'no',
      );
    });

    it('should send connection established event', () => {
      const mockRes = new MockResponse() as unknown as Response;
      const executionId = 'exec-123';

      service.subscribe(executionId, mockRes);

      const written = (mockRes as any).writtenData[0];
      expect(written).toContain('event: connection:established');
      expect(written).toContain('data:');
      expect(written).toContain('Connected to execution stream');
    });

    it('should track client in map', () => {
      const mockRes = new MockResponse() as unknown as Response;
      const executionId = 'exec-123';

      service.subscribe(executionId, mockRes);

      // Verify client is tracked by emitting an event
      mockEngine.emit('execution:started', {
        execution: { id: executionId },
      });

      // Should have received the event
      const written = (mockRes as any).writtenData;
      expect(written.length).toBeGreaterThan(1); // connection + started event
    });

    it('should handle client disconnect', () => {
      const mockRes = new MockResponse() as unknown as Response;
      const executionId = 'exec-123';

      service.subscribe(executionId, mockRes);

      // Simulate disconnect
      (mockRes as any).simulateClose();

      // Emit event - should not be received after disconnect
      const writtenBefore = (mockRes as any).writtenData.length;
      mockEngine.emit('execution:started', {
        execution: { id: executionId },
      });

      expect((mockRes as any).writtenData.length).toBe(writtenBefore);
    });
  });

  describe('event broadcasting', () => {
    it('should broadcast execution:started to clients', () => {
      const mockRes = new MockResponse() as unknown as Response;
      const executionId = 'exec-456';

      service.subscribe(executionId, mockRes);

      mockEngine.emit('execution:started', {
        execution: { id: executionId, status: 'running' },
      });

      const written = (mockRes as any).writtenData;
      const startedEvent = written.find((data: string) =>
        data.includes('execution:started'),
      );

      expect(startedEvent).toBeDefined();
      expect(startedEvent).toContain('event: execution:started');
    });

    it('should broadcast execution:output to clients', () => {
      const mockRes = new MockResponse() as unknown as Response;
      const executionId = 'exec-789';

      service.subscribe(executionId, mockRes);

      mockEngine.emit('execution:output', {
        executionId,
        chunk: 'Hello, world!',
        complete: false,
      });

      const written = (mockRes as any).writtenData;
      const outputEvent = written.find((data: string) =>
        data.includes('execution:output'),
      );

      expect(outputEvent).toBeDefined();
      expect(outputEvent).toContain('Hello, world!');
    });

    it('should broadcast execution:completed to clients', () => {
      const mockRes = new MockResponse() as unknown as Response;
      const executionId = 'exec-complete';

      service.subscribe(executionId, mockRes);

      mockEngine.emit('execution:completed', {
        execution: { id: executionId, status: 'completed' },
        output: 'Done!',
      });

      const written = (mockRes as any).writtenData;
      const completedEvent = written.find((data: string) =>
        data.includes('execution:completed'),
      );

      expect(completedEvent).toBeDefined();
      expect(completedEvent).toContain('event: execution:completed');
    });

    it('should only send to clients subscribed to that execution', () => {
      const mockRes1 = new MockResponse() as unknown as Response;
      const mockRes2 = new MockResponse() as unknown as Response;
      const executionId1 = 'exec-001';
      const executionId2 = 'exec-002';

      service.subscribe(executionId1, mockRes1);
      service.subscribe(executionId2, mockRes2);

      // Emit event for execution 1
      mockEngine.emit('execution:output', {
        executionId: executionId1,
        chunk: 'Only for exec 1',
      });

      // Check res1 received it
      const written1 = (mockRes1 as any).writtenData;
      expect(
        written1.some((data: string) => data.includes('Only for exec 1')),
      ).toBe(true);

      // Check res2 did NOT receive it
      const written2 = (mockRes2 as any).writtenData;
      expect(
        written2.some((data: string) => data.includes('Only for exec 1')),
      ).toBe(false);
    });

    it('should handle multiple clients for same execution', () => {
      const mockRes1 = new MockResponse() as unknown as Response;
      const mockRes2 = new MockResponse() as unknown as Response;
      const executionId = 'exec-shared';

      service.subscribe(executionId, mockRes1);
      service.subscribe(executionId, mockRes2);

      mockEngine.emit('execution:output', {
        executionId,
        chunk: 'Shared output',
      });

      // Both should receive the event
      const written1 = (mockRes1 as any).writtenData;
      const written2 = (mockRes2 as any).writtenData;

      expect(
        written1.some((data: string) => data.includes('Shared output')),
      ).toBe(true);
      expect(
        written2.some((data: string) => data.includes('Shared output')),
      ).toBe(true);
    });
  });

  describe('cleanup', () => {
    it('should remove client on disconnect', () => {
      const mockRes = new MockResponse() as unknown as Response;
      const executionId = 'exec-cleanup';

      service.subscribe(executionId, mockRes);
      (mockRes as any).simulateClose();

      // Verify client removed by checking events not received
      const writtenBefore = (mockRes as any).writtenData.length;
      mockEngine.emit('execution:output', {
        executionId,
        chunk: 'Should not receive',
      });

      expect((mockRes as any).writtenData.length).toBe(writtenBefore);
    });

    it('should not leak memory on client disconnect', () => {
      const mockRes = new MockResponse() as unknown as Response;
      const executionId = 'exec-leak-test';

      service.subscribe(executionId, mockRes);

      // Get initial client count
      const clientsBefore = service.getClientCount(executionId);
      expect(clientsBefore).toBe(1);

      (mockRes as any).simulateClose();

      // Client count should be 0
      const clientsAfter = service.getClientCount(executionId);
      expect(clientsAfter).toBe(0);
    });

    it('should cleanup execution when no clients remain', () => {
      const mockRes1 = new MockResponse() as unknown as Response;
      const mockRes2 = new MockResponse() as unknown as Response;
      const executionId = 'exec-full-cleanup';

      service.subscribe(executionId, mockRes1);
      service.subscribe(executionId, mockRes2);

      expect(service.getClientCount(executionId)).toBe(2);

      (mockRes1 as any).simulateClose();
      expect(service.getClientCount(executionId)).toBe(1);

      (mockRes2 as any).simulateClose();
      expect(service.getClientCount(executionId)).toBe(0);

      // Execution should be cleaned up
      expect(service.hasExecution(executionId)).toBe(false);
    });
  });

  describe('event formatting', () => {
    it('should format SSE event correctly', () => {
      const mockRes = new MockResponse() as unknown as Response;
      const executionId = 'exec-format';

      service.subscribe(executionId, mockRes);

      mockEngine.emit('execution:output', {
        executionId,
        chunk: 'Test output',
      });

      const written = (mockRes as any).writtenData;
      const outputEvent = written.find((data: string) =>
        data.includes('execution:output'),
      );

      // SSE format: event: type\ndata: json\nid: timestamp\n\n
      expect(outputEvent).toContain('event: execution:output');
      expect(outputEvent).toContain('data:');
      expect(outputEvent).toContain('id:');
      expect(outputEvent).toMatch(/\n\n$/); // Should end with double newline
    });

    it('should include event type', () => {
      const mockRes = new MockResponse() as unknown as Response;
      const executionId = 'exec-type';

      service.subscribe(executionId, mockRes);

      mockEngine.emit('execution:token-usage', {
        executionId,
        tokenUsage: { input: 100, output: 200 },
      });

      const written = (mockRes as any).writtenData;
      const tokenEvent = written.find((data: string) =>
        data.includes('execution:token-usage'),
      );

      expect(tokenEvent).toContain('event: execution:token-usage');
    });

    it('should include event ID', () => {
      const mockRes = new MockResponse() as unknown as Response;
      const executionId = 'exec-id';

      service.subscribe(executionId, mockRes);

      mockEngine.emit('execution:started', {
        execution: { id: executionId },
      });

      const written = (mockRes as any).writtenData;
      const startedEvent = written.find((data: string) =>
        data.includes('execution:started'),
      );

      expect(startedEvent).toMatch(/id: \d+/);
    });

    it('should include data as JSON', () => {
      const mockRes = new MockResponse() as unknown as Response;
      const executionId = 'exec-json';

      service.subscribe(executionId, mockRes);

      const testData = {
        executionId,
        chunk: 'JSON test',
        metadata: { foo: 'bar' },
      };

      mockEngine.emit('execution:output', testData);

      const written = (mockRes as any).writtenData;
      const outputEvent = written.find((data: string) =>
        data.includes('execution:output'),
      );

      // Extract JSON data
      const dataLine = outputEvent!
        .split('\n')
        .find((line: string) => line.startsWith('data:'));
      const jsonData = JSON.parse(dataLine!.replace('data: ', ''));

      expect(jsonData).toEqual(testData);
    });
  });

  describe('additional events', () => {
    it('should broadcast execution:step events', () => {
      const mockRes = new MockResponse() as unknown as Response;
      const executionId = 'exec-step';

      service.subscribe(executionId, mockRes);

      mockEngine.emit('execution:step', {
        executionId,
        step: {
          id: 'step-1',
          nodeId: 'node-1',
          status: 'running',
        },
      });

      const written = (mockRes as any).writtenData;
      const stepEvent = written.find((data: string) =>
        data.includes('execution:step'),
      );

      expect(stepEvent).toBeDefined();
      expect(stepEvent).toContain('event: execution:step');
    });

    it('should broadcast execution:failed events', () => {
      const mockRes = new MockResponse() as unknown as Response;
      const executionId = 'exec-failed';

      service.subscribe(executionId, mockRes);

      mockEngine.emit('execution:failed', {
        execution: { id: executionId, status: 'failed' },
        error: 'Something went wrong',
      });

      const written = (mockRes as any).writtenData;
      const failedEvent = written.find((data: string) =>
        data.includes('execution:failed'),
      );

      expect(failedEvent).toBeDefined();
      expect(failedEvent).toContain('Something went wrong');
    });

    it('should broadcast execution:paused events', () => {
      const mockRes = new MockResponse() as unknown as Response;
      const executionId = 'exec-paused';

      service.subscribe(executionId, mockRes);

      mockEngine.emit('execution:paused', { executionId });

      const written = (mockRes as any).writtenData;
      const pausedEvent = written.find((data: string) =>
        data.includes('execution:paused'),
      );

      expect(pausedEvent).toBeDefined();
    });

    it('should broadcast execution:resumed events', () => {
      const mockRes = new MockResponse() as unknown as Response;
      const executionId = 'exec-resumed';

      service.subscribe(executionId, mockRes);

      mockEngine.emit('execution:resumed', { executionId });

      const written = (mockRes as any).writtenData;
      const resumedEvent = written.find((data: string) =>
        data.includes('execution:resumed'),
      );

      expect(resumedEvent).toBeDefined();
    });

    it('should broadcast execution:cancelled events', () => {
      const mockRes = new MockResponse() as unknown as Response;
      const executionId = 'exec-cancelled';

      service.subscribe(executionId, mockRes);

      mockEngine.emit('execution:cancelled', { executionId });

      const written = (mockRes as any).writtenData;
      const cancelledEvent = written.find((data: string) =>
        data.includes('execution:cancelled'),
      );

      expect(cancelledEvent).toBeDefined();
    });
  });
});
