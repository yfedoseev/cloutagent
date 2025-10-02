import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { EventEmitter } from 'events';
import { SSEService } from '../services/SSEService';
import { createExecutionRoutes } from './executions';

describe('Execution SSE Routes', () => {
  let app: express.Application;
  let sseService: SSEService;
  let mockEngine: EventEmitter;

  beforeEach(() => {
    app = express();
    mockEngine = new EventEmitter();
    sseService = new SSEService(mockEngine);

    app.use('/api/executions', createExecutionRoutes(sseService));
  });

  describe('GET /api/executions/:executionId/stream', () => {
    it('should establish SSE connection', (done) => {
      const executionId = 'exec-test-123';

      const req = request(app).get(`/api/executions/${executionId}/stream`);

      req.on('response', (response) => {
        expect(response.headers['content-type']).toBe('text/event-stream');
        expect(response.headers['cache-control']).toBe('no-cache');
        expect(response.headers['connection']).toBe('keep-alive');
        req.abort();
        done();
      });

      req.end();
    });

    it('should send connection established event', (done) => {
      const executionId = 'exec-connect-test';

      const req = request(app).get(`/api/executions/${executionId}/stream`);

      req.on('data', (chunk: Buffer) => {
        const data = chunk.toString();

        if (data.includes('connection:established')) {
          expect(data).toContain('event: connection:established');
          expect(data).toContain('Connected to execution stream');
          req.abort();
          done();
        }
      });

      req.end();
    });

    it('should stream execution events', (done) => {
      const executionId = 'exec-stream-test';
      const events: string[] = [];

      const req = request(app).get(`/api/executions/${executionId}/stream`);

      req.on('data', (chunk: Buffer) => {
        events.push(chunk.toString());

        // Check if we received the execution:output event
        if (events.some((e) => e.includes('execution:output'))) {
          const outputEvent = events.find((e) => e.includes('execution:output'));
          expect(outputEvent).toContain('event: execution:output');
          expect(outputEvent).toContain('Test output chunk');
          req.abort();
          done();
        }
      });

      // Emit event after connection
      setTimeout(() => {
        mockEngine.emit('execution:output', {
          executionId,
          chunk: 'Test output chunk',
          complete: false,
        });
      }, 50);

      req.end();
    });

    it('should handle client disconnect', (done) => {
      const executionId = 'exec-disconnect-test';

      const req = request(app).get(`/api/executions/${executionId}/stream`);

      req.on('data', () => {
        // Get initial client count
        const clientCount = sseService.getClientCount(executionId);
        expect(clientCount).toBe(1);

        // Close the connection
        req.abort();

        // Check client count after disconnect
        setTimeout(() => {
          const afterDisconnect = sseService.getClientCount(executionId);
          expect(afterDisconnect).toBe(0);
          done();
        }, 50);
      });

      req.end();
    });
  });

  describe('POST /api/executions', () => {
    it('should create a new execution (placeholder)', async () => {
      // This is a placeholder test for future execution creation endpoint
      // For now, we're just focusing on SSE streaming
      expect(true).toBe(true);
    });
  });

  describe('GET /api/executions/:executionId', () => {
    it('should get execution status (placeholder)', async () => {
      // This is a placeholder test for future execution status endpoint
      expect(true).toBe(true);
    });
  });

  describe('POST /api/executions/:executionId/pause', () => {
    it('should pause execution (placeholder)', async () => {
      // This is a placeholder test for future pause endpoint
      expect(true).toBe(true);
    });
  });

  describe('POST /api/executions/:executionId/resume', () => {
    it('should resume execution (placeholder)', async () => {
      // This is a placeholder test for future resume endpoint
      expect(true).toBe(true);
    });
  });

  describe('POST /api/executions/:executionId/cancel', () => {
    it('should cancel execution (placeholder)', async () => {
      // This is a placeholder test for future cancel endpoint
      expect(true).toBe(true);
    });
  });
});
