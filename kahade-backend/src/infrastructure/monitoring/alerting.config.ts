// ============================================================================
// ALERTING CONFIGURATION
// ============================================================================
// Fix #90: Define alerting rules and thresholds
// ============================================================================

export interface AlertRule {
  name: string;
  description: string;
  metric: string;
  condition: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  threshold: number;
  duration: number; // seconds
  severity: 'critical' | 'warning' | 'info';
  labels?: Record<string, string>;
}

/**
 * Application alerting rules
 */
export const alertRules: AlertRule[] = [
  // Error rate alerts
  {
    name: 'HighErrorRate',
    description: 'Error rate is above 5%',
    metric: 'http_requests_total{status=~"5.."}',
    condition: 'gt',
    threshold: 0.05,
    duration: 60,
    severity: 'critical',
  },
  {
    name: 'ElevatedErrorRate',
    description: 'Error rate is above 1%',
    metric: 'http_requests_total{status=~"5.."}',
    condition: 'gt',
    threshold: 0.01,
    duration: 300,
    severity: 'warning',
  },

  // Latency alerts
  {
    name: 'HighLatency',
    description: 'P99 latency is above 2 seconds',
    metric: 'http_request_duration_ms_bucket{le="2000"}',
    condition: 'lt',
    threshold: 0.99,
    duration: 60,
    severity: 'critical',
  },
  {
    name: 'ElevatedLatency',
    description: 'P95 latency is above 500ms',
    metric: 'http_request_duration_ms_bucket{le="500"}',
    condition: 'lt',
    threshold: 0.95,
    duration: 300,
    severity: 'warning',
  },

  // Database alerts
  {
    name: 'DatabaseConnectionPoolExhausted',
    description: 'Database connection pool is nearly exhausted',
    metric: 'db_pool_connections_active',
    condition: 'gt',
    threshold: 18, // 90% of 20 max connections
    duration: 60,
    severity: 'critical',
  },
  {
    name: 'SlowDatabaseQueries',
    description: 'Database queries taking too long',
    metric: 'db_query_duration_ms_bucket{le="1000"}',
    condition: 'lt',
    threshold: 0.95,
    duration: 300,
    severity: 'warning',
  },

  // Cache alerts
  {
    name: 'LowCacheHitRate',
    description: 'Cache hit rate is below 80%',
    metric: 'cache_hits_total / (cache_hits_total + cache_misses_total)',
    condition: 'lt',
    threshold: 0.8,
    duration: 600,
    severity: 'warning',
  },

  // Business alerts
  {
    name: 'HighDisputeRate',
    description: 'Dispute rate is unusually high',
    metric: 'disputes_opened_total / orders_created_total',
    condition: 'gt',
    threshold: 0.1, // 10% dispute rate
    duration: 3600,
    severity: 'warning',
  },
  {
    name: 'PendingWithdrawalsBacklog',
    description: 'Too many pending withdrawals',
    metric: 'pending_withdrawals_count',
    condition: 'gt',
    threshold: 100,
    duration: 1800,
    severity: 'warning',
  },

  // Authentication alerts
  {
    name: 'HighLoginFailureRate',
    description: 'Login failure rate is unusually high',
    metric: 'auth_login_failed_total / (auth_login_success_total + auth_login_failed_total)',
    condition: 'gt',
    threshold: 0.3, // 30% failure rate
    duration: 300,
    severity: 'warning',
  },
  {
    name: 'SuspectedBruteForce',
    description: 'Possible brute force attack detected',
    metric: 'auth_login_failed_total',
    condition: 'gt',
    threshold: 100, // 100 failures in window
    duration: 60,
    severity: 'critical',
  },
];

/**
 * Prometheus alerting rules format
 */
export function generatePrometheusAlertRules(): string {
  const groups = [
    {
      name: 'kahade-alerts',
      rules: alertRules.map((rule) => ({
        alert: rule.name,
        expr: `${rule.metric} ${getOperator(rule.condition)} ${rule.threshold}`,
        for: `${rule.duration}s`,
        labels: {
          severity: rule.severity,
          ...rule.labels,
        },
        annotations: {
          summary: rule.description,
          description: `${rule.name}: ${rule.description}`,
        },
      })),
    },
  ];

  return `groups:\n${JSON.stringify(groups, null, 2)}`;
}

function getOperator(condition: AlertRule['condition']): string {
  switch (condition) {
    case 'gt':
      return '>';
    case 'lt':
      return '<';
    case 'eq':
      return '==';
    case 'gte':
      return '>=';
    case 'lte':
      return '<=';
  }
}
