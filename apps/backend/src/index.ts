import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { VariableService } from './services/VariableService';
import { WorkflowService } from './services/WorkflowService';
import { SSEService } from './services/SSEService';
import { HookExecutionService } from './services/HookExecutionService';
import { SubagentService } from './services/SubagentService';
import { ClaudeAgentSDKService } from './services/ClaudeAgentSDKService';
import { ExecutionEngine } from './services/ExecutionEngine';
import { ExecutionHistoryService } from './services/ExecutionHistoryService';
import { ErrorRecoveryService } from './services/ErrorRecoveryService';
import { createVariableRoutes } from './routes/variables';
import { createWorkflowRoutes } from './routes/workflows';
import { createExecutionRoutes } from './routes/executions';
import { createHookRoutes } from './routes/hooks';
import { createSubagentRoutes } from './routes/subagents';
import { createExecutionHistoryRoutes } from './routes/execution-history';
import { createValidationRoutes } from './routes/validation';
import { createTestModeRoutes } from './routes/test-mode';
import { createErrorRecoveryRoutes } from './routes/error-recovery';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  }),
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many requests, please try again later',
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Initialize services
const variableService = new VariableService();
const workflowService = new WorkflowService();
const hookExecutionService = new HookExecutionService();
const executionHistoryService = new ExecutionHistoryService();
const errorRecoveryService = new ErrorRecoveryService();

// Initialize Claude Agent SDK Service
const claudeAgentSDKService = new ClaudeAgentSDKService();

// Mock cost tracker for SubagentService (to be replaced with real implementation)
const mockCostTracker = {
  trackSubagent: async (data: any) => {
    console.log('Cost tracked:', data);
  },
};

// Initialize SubagentService with ClaudeAgentSDKService
const subagentService = new SubagentService(claudeAgentSDKService, mockCostTracker);

// Initialize execution engine with all dependencies
const executionEngine = new ExecutionEngine(
  claudeAgentSDKService,
  subagentService,
  hookExecutionService,
  variableService,
  executionHistoryService,
  errorRecoveryService,
);

// Initialize SSE service for real-time execution monitoring
const sseService = new SSEService(executionEngine);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.get('/api/v1/projects', (req, res) => {
  res.json({ message: 'Projects endpoint - coming soon' });
});

// Variable management routes
app.use(
  '/api/projects/:projectId/variables',
  createVariableRoutes(variableService),
);

// Workflow management routes
app.use(
  '/api/projects/:projectId/workflow',
  createWorkflowRoutes(workflowService),
);

// Execution monitoring routes (SSE streaming)
app.use('/api/executions', createExecutionRoutes(sseService));

// Hook routes
app.use('/api/hooks', createHookRoutes(hookExecutionService));

// Subagent routes
app.use(
  '/api/projects/:projectId/subagents',
  createSubagentRoutes(subagentService),
);

// Execution history routes
app.use(
  '/api/projects/:projectId/executions',
  createExecutionHistoryRoutes(executionHistoryService),
);

// Validation routes
app.use('/api/projects/:projectId/validate', createValidationRoutes());

// Test mode routes (TASK-040)
app.use('/api/projects/:projectId/test', createTestModeRoutes());

// Error recovery routes (TASK-036)
app.use(
  '/api/projects/:projectId/recovery',
  createErrorRecoveryRoutes(errorRecoveryService),
);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(err.stack);
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  },
);

app.listen(PORT, () => {
  console.log(`🚀 CloutAgent backend running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📡 SSE streaming: http://localhost:${PORT}/api/executions/:id/stream`);
});
