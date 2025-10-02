# Phase 8: Monitoring & Polish - Execution Plan

**Timeline**: Week 14
**Focus**: Analytics, Performance, Error Tracking, UI Polish
**Goal**: Production-ready monitoring, analytics dashboard, performance optimization, and polished UX

## Overview

Phase 8 focuses on production readiness and user experience:
- **Analytics Dashboard**: Usage metrics, execution stats, cost tracking
- **Performance Monitoring**: Response times, bottlenecks, optimization
- **Error Tracking**: Error aggregation, alerting, debugging
- **Cost Optimization**: Token usage optimization, caching strategies
- **UI/UX Polish**: Responsive design, accessibility, animations
- **Performance Optimization**: Code splitting, lazy loading, caching

## Interface Contracts

### IC-031: Analytics & Metrics Interface

**Purpose**: Track usage, performance, and cost metrics

```typescript
// packages/types/src/analytics.ts

export interface AnalyticsDashboard {
  projectId: string;
  period: {
    start: Date;
    end: Date;
  };
  metrics: {
    executions: ExecutionMetrics;
    costs: CostMetrics;
    performance: PerformanceMetrics;
    errors: ErrorMetrics;
  };
}

export interface ExecutionMetrics {
  total: number;
  successful: number;
  failed: number;
  cancelled: number;
  averageDuration: number;
  successRate: number;
  byNode: Record<string, NodeMetrics>;
  byDay: TimeSeriesData[];
}

export interface NodeMetrics {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  executions: number;
  averageDuration: number;
  successRate: number;
  tokenUsage: number;
  costUSD: number;
}

export interface CostMetrics {
  totalUSD: number;
  byModel: Record<string, number>;
  byNode: Record<string, number>;
  byDay: TimeSeriesData[];
  projectedMonthly: number;
  budget?: {
    limit: number;
    used: number;
    remaining: number;
    percentUsed: number;
  };
}

export interface PerformanceMetrics {
  averageResponseTime: number;
  p50ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  slowestExecutions: {
    executionId: string;
    duration: number;
    timestamp: Date;
  }[];
  bottlenecks: {
    nodeId: string;
    averageDuration: number;
    count: number;
  }[];
}

export interface ErrorMetrics {
  totalErrors: number;
  errorRate: number;
  byType: Record<string, number>;
  byNode: Record<string, number>;
  recentErrors: {
    executionId: string;
    error: string;
    timestamp: Date;
    nodeId?: string;
  }[];
}

export interface TimeSeriesData {
  timestamp: Date;
  value: number;
}

export interface UsageAlert {
  id: string;
  type: 'cost' | 'error-rate' | 'performance' | 'rate-limit';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  threshold: number;
  current: number;
  triggeredAt: Date;
  resolved: boolean;
}
```

**API Endpoints**:
```typescript
// GET /api/projects/{projectId}/analytics
// Query: ?start=2025-01-01&end=2025-01-31
// Response: AnalyticsDashboard

// GET /api/projects/{projectId}/analytics/executions
// Response: ExecutionMetrics

// GET /api/projects/{projectId}/analytics/costs
// Response: CostMetrics

// GET /api/projects/{projectId}/analytics/performance
// Response: PerformanceMetrics

// GET /api/projects/{projectId}/analytics/errors
// Response: ErrorMetrics

// GET /api/projects/{projectId}/alerts
// Response: { alerts: UsageAlert[] }

// POST /api/projects/{projectId}/alerts/{alertId}/resolve
// Response: { success: boolean }
```

---

### IC-032: Error Tracking Interface

**Purpose**: Aggregate, track, and analyze errors

```typescript
// packages/types/src/error-tracking.ts

export interface ErrorReport {
  id: string;
  projectId: string;
  executionId?: string;
  error: {
    message: string;
    code: string;
    stack?: string;
    type: string;
  };
  context: {
    nodeId?: string;
    nodeType?: string;
    input?: any;
    environment: string;
    userAgent?: string;
  };
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  occurrences: number;
  firstSeen: Date;
  lastSeen: Date;
}

export interface ErrorGroup {
  id: string;
  fingerprint: string; // Hash of error signature
  message: string;
  type: string;
  occurrences: number;
  affectedExecutions: number;
  firstSeen: Date;
  lastSeen: Date;
  resolved: boolean;
  errors: ErrorReport[];
}

export interface ErrorFilter {
  resolved?: boolean;
  type?: string;
  nodeId?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

export interface ErrorResolution {
  errorId: string;
  resolution: string;
  preventionSteps?: string[];
  relatedIssues?: string[];
}
```

**API Endpoints**:
```typescript
// GET /api/projects/{projectId}/errors
// Query: ?resolved=false&type=TIMEOUT
// Response: { errors: ErrorGroup[] }

// GET /api/projects/{projectId}/errors/{errorId}
// Response: ErrorReport

// POST /api/projects/{projectId}/errors/{errorId}/resolve
// Body: ErrorResolution
// Response: { success: boolean }

// GET /api/projects/{projectId}/errors/stats
// Response: { totalErrors: number, errorRate: number, topErrors: ErrorGroup[] }
```

---

### IC-033: Performance Monitoring Interface

**Purpose**: Track and optimize application performance

```typescript
// packages/types/src/performance.ts

export interface PerformanceReport {
  projectId: string;
  timestamp: Date;
  metrics: {
    frontend: FrontendMetrics;
    backend: BackendMetrics;
    execution: ExecutionPerformanceMetrics;
  };
  recommendations: PerformanceRecommendation[];
}

export interface FrontendMetrics {
  pageLoadTime: number;
  timeToInteractive: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  bundleSize: {
    total: number;
    javascript: number;
    css: number;
    images: number;
  };
}

export interface BackendMetrics {
  averageResponseTime: number;
  requestsPerSecond: number;
  databaseQueryTime: number;
  memoryUsage: number;
  cpuUsage: number;
}

export interface ExecutionPerformanceMetrics {
  averageExecutionTime: number;
  tokenProcessingSpeed: number; // Tokens per second
  apiLatency: number;
  cacheHitRate: number;
}

export interface PerformanceRecommendation {
  type: 'frontend' | 'backend' | 'execution';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  impact: string; // Expected improvement
  effort: 'low' | 'medium' | 'high';
  action: string;
}

export interface CacheStrategy {
  enabled: boolean;
  ttl: number; // Time to live in seconds
  maxSize: number; // Max cache size in MB
  evictionPolicy: 'lru' | 'lfu' | 'fifo';
  hitRate: number;
  savings: {
    costUSD: number;
    apiCalls: number;
  };
}
```

**API Endpoints**:
```typescript
// GET /api/performance/report
// Query: ?projectId=xxx
// Response: PerformanceReport

// GET /api/performance/recommendations
// Response: { recommendations: PerformanceRecommendation[] }

// GET /api/performance/cache-stats
// Response: CacheStrategy
```

---

## Tasks

### TASK-052: Analytics Service

**Agent**: backend-engineer
**Priority**: P0
**Estimated Time**: 6 hours
**Dependencies**: TASK-034 (Execution History), IC-031

**Description**: Implement analytics aggregation and dashboard data generation.

**Implementation Skeleton**:
```typescript
// apps/backend/src/services/AnalyticsService.ts

import {
  AnalyticsDashboard,
  ExecutionMetrics,
  CostMetrics,
  PerformanceMetrics,
  ErrorMetrics,
  TimeSeriesData,
} from '@cloutagent/types';
import { ExecutionHistoryService } from './ExecutionHistoryService';

export class AnalyticsService {
  constructor(private historyService: ExecutionHistoryService) {}

  async getDashboard(
    projectId: string,
    period: { start: Date; end: Date }
  ): Promise<AnalyticsDashboard> {
    const executions = await this.historyService.listExecutions(projectId, {});

    const filtered = executions.executions.filter(
      e => e.startedAt >= period.start && e.startedAt <= period.end
    );

    return {
      projectId,
      period,
      metrics: {
        executions: this.calculateExecutionMetrics(filtered),
        costs: this.calculateCostMetrics(filtered),
        performance: this.calculatePerformanceMetrics(filtered),
        errors: this.calculateErrorMetrics(filtered),
      },
    };
  }

  private calculateExecutionMetrics(executions: Execution[]): ExecutionMetrics {
    const successful = executions.filter(e => e.status === 'completed');
    const failed = executions.filter(e => e.status === 'failed');
    const cancelled = executions.filter(e => e.status === 'cancelled');

    const totalDuration = executions.reduce(
      (sum, e) => sum + (e.duration || 0),
      0
    );

    // Group by node
    const byNode: Record<string, NodeMetrics> = {};
    executions.forEach(execution => {
      execution.steps.forEach(step => {
        if (!byNode[step.nodeId]) {
          byNode[step.nodeId] = {
            nodeId: step.nodeId,
            nodeName: step.nodeId, // TODO: Get actual name
            nodeType: step.nodeType,
            executions: 0,
            averageDuration: 0,
            successRate: 0,
            tokenUsage: 0,
            costUSD: 0,
          };
        }

        byNode[step.nodeId].executions++;
        byNode[step.nodeId].averageDuration += step.duration || 0;
        byNode[step.nodeId].tokenUsage +=
          (step.tokenUsage?.input || 0) + (step.tokenUsage?.output || 0);
      });
    });

    // Calculate averages
    Object.values(byNode).forEach(node => {
      node.averageDuration /= node.executions;
      node.successRate =
        (node.executions - failed.length) / node.executions;
    });

    // Group by day
    const byDay = this.groupByDay(executions);

    return {
      total: executions.length,
      successful: successful.length,
      failed: failed.length,
      cancelled: cancelled.length,
      averageDuration: totalDuration / executions.length || 0,
      successRate: successful.length / executions.length || 0,
      byNode,
      byDay,
    };
  }

  private calculateCostMetrics(executions: Execution[]): CostMetrics {
    const totalCost = executions.reduce((sum, e) => sum + e.costUSD, 0);

    // Group by model (assuming all use same model for now)
    const byModel = {
      'claude-sonnet-4.5': totalCost,
    };

    // Group by node
    const byNode: Record<string, number> = {};
    executions.forEach(execution => {
      execution.steps.forEach(step => {
        if (!byNode[step.nodeId]) {
          byNode[step.nodeId] = 0;
        }
        // Calculate cost from token usage
        const cost = this.calculateStepCost(step);
        byNode[step.nodeId] += cost;
      });
    });

    const byDay = this.groupCostByDay(executions);

    // Project monthly cost
    const daysInPeriod =
      (new Date().getTime() - executions[0]?.startedAt.getTime()) /
      (1000 * 60 * 60 * 24);
    const projectedMonthly = (totalCost / daysInPeriod) * 30;

    return {
      totalUSD: totalCost,
      byModel,
      byNode,
      byDay,
      projectedMonthly,
    };
  }

  private calculatePerformanceMetrics(
    executions: Execution[]
  ): PerformanceMetrics {
    const durations = executions
      .map(e => e.duration || 0)
      .filter(d => d > 0)
      .sort((a, b) => a - b);

    const p50 = this.percentile(durations, 50);
    const p95 = this.percentile(durations, 95);
    const p99 = this.percentile(durations, 99);

    // Find slowest executions
    const slowest = [...executions]
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))
      .slice(0, 10)
      .map(e => ({
        executionId: e.id,
        duration: e.duration || 0,
        timestamp: e.startedAt,
      }));

    // Find bottleneck nodes
    const nodeDurations: Record<string, number[]> = {};
    executions.forEach(execution => {
      execution.steps.forEach(step => {
        if (!nodeDurations[step.nodeId]) {
          nodeDurations[step.nodeId] = [];
        }
        nodeDurations[step.nodeId].push(step.duration || 0);
      });
    });

    const bottlenecks = Object.entries(nodeDurations)
      .map(([nodeId, durations]) => ({
        nodeId,
        averageDuration:
          durations.reduce((sum, d) => sum + d, 0) / durations.length,
        count: durations.length,
      }))
      .sort((a, b) => b.averageDuration - a.averageDuration)
      .slice(0, 5);

    return {
      averageResponseTime: durations.reduce((sum, d) => sum + d, 0) / durations.length || 0,
      p50ResponseTime: p50,
      p95ResponseTime: p95,
      p99ResponseTime: p99,
      slowestExecutions: slowest,
      bottlenecks,
    };
  }

  private calculateErrorMetrics(executions: Execution[]): ErrorMetrics {
    const failed = executions.filter(e => e.status === 'failed');

    // Group by error type
    const byType: Record<string, number> = {};
    failed.forEach(execution => {
      const errorType = this.classifyError(execution.error || '');
      byType[errorType] = (byType[errorType] || 0) + 1;
    });

    // Group by node
    const byNode: Record<string, number> = {};
    failed.forEach(execution => {
      const failedStep = execution.steps.find(s => s.status === 'failed');
      if (failedStep) {
        byNode[failedStep.nodeId] = (byNode[failedStep.nodeId] || 0) + 1;
      }
    });

    // Recent errors
    const recentErrors = failed
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
      .slice(0, 10)
      .map(e => ({
        executionId: e.id,
        error: e.error || 'Unknown error',
        timestamp: e.startedAt,
        nodeId: e.steps.find(s => s.status === 'failed')?.nodeId,
      }));

    return {
      totalErrors: failed.length,
      errorRate: failed.length / executions.length || 0,
      byType,
      byNode,
      recentErrors,
    };
  }

  private groupByDay(executions: Execution[]): TimeSeriesData[] {
    const byDay: Record<string, number> = {};

    executions.forEach(execution => {
      const day = execution.startedAt.toISOString().split('T')[0];
      byDay[day] = (byDay[day] || 0) + 1;
    });

    return Object.entries(byDay)
      .map(([date, count]) => ({
        timestamp: new Date(date),
        value: count,
      }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  private groupCostByDay(executions: Execution[]): TimeSeriesData[] {
    const byDay: Record<string, number> = {};

    executions.forEach(execution => {
      const day = execution.startedAt.toISOString().split('T')[0];
      byDay[day] = (byDay[day] || 0) + execution.costUSD;
    });

    return Object.entries(byDay)
      .map(([date, cost]) => ({
        timestamp: new Date(date),
        value: cost,
      }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  private percentile(values: number[], p: number): number {
    if (values.length === 0) return 0;

    const index = Math.ceil((p / 100) * values.length) - 1;
    return values[index] || 0;
  }

  private calculateStepCost(step: ExecutionStep): number {
    if (!step.tokenUsage) return 0;

    const INPUT_COST_PER_1M = 3.0;
    const OUTPUT_COST_PER_1M = 15.0;

    const inputCost = (step.tokenUsage.input / 1_000_000) * INPUT_COST_PER_1M;
    const outputCost = (step.tokenUsage.output / 1_000_000) * OUTPUT_COST_PER_1M;

    return inputCost + outputCost;
  }

  private classifyError(error: string): string {
    if (error.includes('timeout')) return 'TIMEOUT';
    if (error.includes('rate limit')) return 'RATE_LIMIT';
    if (error.includes('authentication')) return 'AUTH_ERROR';
    if (error.includes('validation')) return 'VALIDATION_ERROR';
    return 'UNKNOWN_ERROR';
  }
}
```

**Acceptance Criteria**:
- [ ] Dashboard aggregates all metrics
- [ ] Execution metrics by node and day
- [ ] Cost metrics with monthly projection
- [ ] Performance percentiles (p50, p95, p99)
- [ ] Error classification and grouping
- [ ] Bottleneck identification

**Test Cases**:
```typescript
describe('AnalyticsService', () => {
  it('should calculate execution metrics correctly', async () => {
    const dashboard = await service.getDashboard('proj-001', {
      start: new Date('2025-01-01'),
      end: new Date('2025-01-31'),
    });

    expect(dashboard.metrics.executions.total).toBe(100);
    expect(dashboard.metrics.executions.successRate).toBeGreaterThan(0.9);
  });

  it('should identify bottleneck nodes', async () => {
    const dashboard = await service.getDashboard('proj-001', period);

    expect(dashboard.metrics.performance.bottlenecks).toHaveLength(5);
    expect(dashboard.metrics.performance.bottlenecks[0].averageDuration).toBeGreaterThan(0);
  });
});
```

---

### TASK-053: Analytics Dashboard UI

**Agent**: frontend-engineer
**Priority**: P0
**Estimated Time**: 6 hours
**Dependencies**: TASK-052 (Analytics Service), IC-031

**Description**: Create comprehensive analytics dashboard with charts and metrics.

**Implementation Skeleton**:
```typescript
// apps/frontend/src/components/AnalyticsDashboard.tsx

import { useState, useEffect } from 'react';
import { AnalyticsDashboard } from '@cloutagent/types';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

export function AnalyticsDashboard({ projectId }: { projectId: string }) {
  const [dashboard, setDashboard] = useState<AnalyticsDashboard | null>(null);
  const [period, setPeriod] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
    end: new Date(),
  });

  useEffect(() => {
    loadDashboard();
  }, [period]);

  const loadDashboard = async () => {
    const response = await fetch(
      `/api/projects/${projectId}/analytics?` +
        `start=${period.start.toISOString()}&end=${period.end.toISOString()}`
    );
    const data = await response.json();
    setDashboard(data);
  };

  if (!dashboard) return <div>Loading...</div>;

  return (
    <div className="p-6 bg-gray-900 text-white">
      <h1 className="text-2xl font-bold mb-6">📊 Analytics Dashboard</h1>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <MetricCard
          title="Total Executions"
          value={dashboard.metrics.executions.total}
          icon="🚀"
          trend={+5.2}
        />

        <MetricCard
          title="Success Rate"
          value={`${(dashboard.metrics.executions.successRate * 100).toFixed(1)}%`}
          icon="✅"
          trend={+2.1}
        />

        <MetricCard
          title="Total Cost"
          value={`$${dashboard.metrics.costs.totalUSD.toFixed(2)}`}
          icon="💰"
          trend={-3.5}
        />

        <MetricCard
          title="Avg Response Time"
          value={`${dashboard.metrics.performance.averageResponseTime.toFixed(0)}ms`}
          icon="⚡"
          trend={-12.3}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Executions Over Time */}
        <div className="p-4 bg-gray-800 rounded">
          <h3 className="font-semibold mb-4">Executions Over Time</h3>
          <LineChart width={500} height={300} data={dashboard.metrics.executions.byDay}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={date => new Date(date).toLocaleDateString()}
              stroke="#9CA3AF"
            />
            <YAxis stroke="#9CA3AF" />
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
              labelFormatter={date => new Date(date).toLocaleDateString()}
            />
            <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} />
          </LineChart>
        </div>

        {/* Cost Over Time */}
        <div className="p-4 bg-gray-800 rounded">
          <h3 className="font-semibold mb-4">Cost Over Time</h3>
          <LineChart width={500} height={300} data={dashboard.metrics.costs.byDay}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={date => new Date(date).toLocaleDateString()}
              stroke="#9CA3AF"
            />
            <YAxis stroke="#9CA3AF" />
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
              labelFormatter={date => new Date(date).toLocaleDateString()}
              formatter={(value: number) => `$${value.toFixed(2)}`}
            />
            <Line type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2} />
          </LineChart>
        </div>
      </div>

      {/* Bottlenecks */}
      <div className="p-4 bg-gray-800 rounded mb-8">
        <h3 className="font-semibold mb-4">Performance Bottlenecks</h3>
        <div className="space-y-2">
          {dashboard.metrics.performance.bottlenecks.map(bottleneck => (
            <div
              key={bottleneck.nodeId}
              className="flex items-center justify-between p-3 bg-gray-700 rounded"
            >
              <div>
                <div className="font-medium">{bottleneck.nodeId}</div>
                <div className="text-sm text-gray-400">
                  {bottleneck.count} executions
                </div>
              </div>

              <div className="text-right">
                <div className="text-yellow-400 font-semibold">
                  {bottleneck.averageDuration.toFixed(0)}ms
                </div>
                <div className="text-xs text-gray-400">avg duration</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Error Summary */}
      <div className="p-4 bg-gray-800 rounded">
        <h3 className="font-semibold mb-4">Recent Errors</h3>
        <div className="space-y-2">
          {dashboard.metrics.errors.recentErrors.map((error, i) => (
            <div key={i} className="p-3 bg-red-900/30 border border-red-700 rounded">
              <div className="flex items-start justify-between mb-1">
                <div className="font-mono text-sm text-red-300">{error.executionId}</div>
                <div className="text-xs text-gray-400">
                  {new Date(error.timestamp).toLocaleString()}
                </div>
              </div>

              <div className="text-sm text-red-200">{error.error}</div>

              {error.nodeId && (
                <div className="text-xs text-gray-400 mt-1">Node: {error.nodeId}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
  trend,
}: {
  title: string;
  value: string | number;
  icon: string;
  trend?: number;
}) {
  return (
    <div className="p-4 bg-gray-800 rounded">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-gray-400">{title}</div>
        <div className="text-2xl">{icon}</div>
      </div>

      <div className="text-2xl font-bold mb-1">{value}</div>

      {trend !== undefined && (
        <div
          className={`text-sm ${
            trend >= 0 ? 'text-green-400' : 'text-red-400'
          }`}
        >
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%
        </div>
      )}
    </div>
  );
}
```

**Acceptance Criteria**:
- [ ] Key metrics cards with trends
- [ ] Execution and cost line charts
- [ ] Bottleneck list with avg durations
- [ ] Recent errors displayed
- [ ] Responsive layout
- [ ] Interactive charts with tooltips

---

### TASK-054: UI/UX Polish

**Agent**: ui-ux-designer + frontend-engineer
**Priority**: P1
**Estimated Time**: 8 hours
**Dependencies**: All frontend tasks

**Description**: Comprehensive UI polish, animations, accessibility improvements.

**Implementation Focus**:
- Responsive design for mobile/tablet
- Dark/light theme support
- Smooth transitions and animations
- Keyboard navigation
- ARIA labels for screen readers
- Loading states and skeletons
- Error boundaries
- Toast notifications

**Acceptance Criteria**:
- [ ] Responsive on all screen sizes
- [ ] WCAG 2.1 AA compliant
- [ ] Smooth page transitions
- [ ] Loading skeletons for async content
- [ ] Error boundaries catch React errors
- [ ] Toast notifications for user actions
- [ ] Keyboard shortcuts documented

---

### TASK-055: Performance Optimization

**Agent**: frontend-engineer + backend-engineer
**Priority**: P1
**Estimated Time**: 6 hours
**Dependencies**: All tasks

**Description**: Optimize frontend and backend performance.

**Implementation Focus**:
- **Frontend**:
  - Code splitting with React.lazy
  - Image optimization
  - Bundle size reduction
  - Lazy loading for heavy components
  - Memoization (useMemo, useCallback)

- **Backend**:
  - Response caching
  - Database query optimization
  - Gzip compression
  - Rate limiting

**Acceptance Criteria**:
- [ ] Lighthouse score >90
- [ ] Bundle size <500KB (gzipped)
- [ ] Page load time <2s
- [ ] API response time <500ms (p95)
- [ ] Database queries optimized (N+1 eliminated)

---

## Testing Strategy

### Unit Tests
- Analytics calculations
- Error classification
- Performance metric calculations

### Integration Tests
- Dashboard data loading
- Error tracking workflow
- Performance monitoring

### E2E Tests
- View analytics dashboard
- Track errors
- Monitor performance

## Success Metrics

- [ ] Analytics dashboard loads in <1s
- [ ] All metrics accurate (validated against raw data)
- [ ] Error tracking captures 100% of errors
- [ ] Performance recommendations actionable
- [ ] UI accessible (WCAG 2.1 AA)

## Dependencies

### External Libraries
- `recharts`: Charts and visualizations
- `react-error-boundary`: Error boundaries

### Phase Dependencies
- Phase 4: Execution history
- All previous phases for complete metrics

## Rollout Plan

1. **Week 14 Days 1-2**: Analytics backend (TASK-052)
2. **Week 14 Days 3-4**: Analytics UI (TASK-053)
3. **Week 14 Days 4-5**: Polish and optimization (TASK-054, TASK-055)

## Notes

- **Analytics**: Real-time vs batch processing trade-off
- **Performance**: Caching critical for large datasets
- **UX**: Progressive disclosure for complex features
- **Accessibility**: Must work with screen readers
