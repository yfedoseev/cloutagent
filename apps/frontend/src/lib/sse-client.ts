import { SSEEventType } from '@cloutagent/types';

/**
 * SSE Client for real-time execution monitoring
 *
 * Usage:
 * ```typescript
 * const client = new SSEClient();
 *
 * client.on('execution:output', (data) => {
 *   console.log('Output:', data.chunk);
 * });
 *
 * client.on('execution:completed', (data) => {
 *   console.log('Execution completed!');
 * });
 *
 * client.connect('exec-123');
 *
 * // Later...
 * client.disconnect();
 * ```
 */
export class SSEClient {
  private eventSource: EventSource | null = null;
  private eventHandlers = new Map<string, (data: any) => void>();
  private executionId: string | null = null;

  /**
   * Connect to an execution's event stream
   */
  connect(executionId: string, baseUrl?: string): void {
    if (this.eventSource) {
      this.disconnect();
    }

    this.executionId = executionId;
    const url = `${baseUrl || ''}/api/executions/${executionId}/stream`;

    this.eventSource = new EventSource(url);

    // Connection established
    this.eventSource.addEventListener('connection:established', () => {
      console.log('[SSE] Connected to execution stream:', executionId);
    });

    // Register all event handlers
    this.eventHandlers.forEach((handler, eventType) => {
      this.addEventListener(eventType, handler);
    });

    // Error handling
    this.eventSource.onerror = error => {
      console.error('[SSE] Connection error:', error);
      this.disconnect();

      // Call error handler if registered
      const errorHandler = this.eventHandlers.get('error');
      if (errorHandler) {
        errorHandler(error);
      }
    };
  }

  /**
   * Register an event handler
   */
  on(eventType: SSEEventType | 'error', handler: (data: any) => void): void {
    this.eventHandlers.set(eventType, handler);

    // If already connected, add listener immediately
    if (this.eventSource && eventType !== 'error') {
      this.addEventListener(eventType, handler);
    }
  }

  /**
   * Remove an event handler
   */
  off(eventType: SSEEventType | 'error'): void {
    this.eventHandlers.delete(eventType);
  }

  /**
   * Disconnect from the event stream
   */
  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      this.executionId = null;
      console.log('[SSE] Disconnected from execution stream');
    }
  }

  /**
   * Get the current execution ID
   */
  getExecutionId(): string | null {
    return this.executionId;
  }

  /**
   * Check if currently connected
   */
  isConnected(): boolean {
    return this.eventSource !== null;
  }

  private addEventListener(
    eventType: string,
    handler: (data: any) => void,
  ): void {
    if (!this.eventSource) return;

    this.eventSource.addEventListener(eventType, (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        handler(data);
      } catch (error) {
        console.error('[SSE] Failed to parse event data:', error);
      }
    });
  }
}

// Singleton instance for convenience
export const sseClient = new SSEClient();

/**
 * React hook for SSE connection
 *
 * Usage:
 * ```typescript
 * function ExecutionMonitor({ executionId }: { executionId: string }) {
 *   const [output, setOutput] = useState('');
 *   const [status, setStatus] = useState('running');
 *
 *   useSSEConnection(executionId, {
 *     onOutput: (data) => setOutput(prev => prev + data.chunk),
 *     onCompleted: () => setStatus('completed'),
 *     onFailed: () => setStatus('failed'),
 *   });
 *
 *   return (
 *     <div>
 *       <div>Status: {status}</div>
 *       <pre>{output}</pre>
 *     </div>
 *   );
 * }
 * ```
 */
export interface SSEConnectionCallbacks {
  onStarted?: (data: any) => void;
  onProgress?: (data: any) => void;
  onStep?: (data: any) => void;
  onOutput?: (data: any) => void;
  onTokenUsage?: (data: any) => void;
  onCompleted?: (data: any) => void;
  onFailed?: (data: any) => void;
  onPaused?: (data: any) => void;
  onResumed?: (data: any) => void;
  onCancelled?: (data: any) => void;
  onError?: (error: any) => void;
}

export function useSSEConnection(
  _executionId: string | null,
  _callbacks: SSEConnectionCallbacks,
  _baseUrl?: string,
): void {
  // This will be implemented with React useEffect
  // For now, it's just a type definition and placeholder

  if (typeof window === 'undefined') {
    console.warn('[SSE] useSSEConnection called in non-browser environment');
    return;
  }

  // Implementation placeholder - will be completed when React integration is needed
  console.log('[SSE] useSSEConnection hook ready for React integration');
}
