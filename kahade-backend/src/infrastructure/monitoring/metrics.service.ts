import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// ============================================================================
// METRICS SERVICE
// ============================================================================
// Fix #89: Application metrics collection for monitoring
// ============================================================================

/**
 * Metric types
 */
export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram',
}

/**
 * Metric data structure
 */
interface Metric {
  name: string;
  type: MetricType;
  value: number;
  labels: Record<string, string>;
  timestamp: number;
}

/**
 * Histogram bucket configuration
 */
interface HistogramBuckets {
  buckets: number[];
  values: number[];
  sum: number;
  count: number;
}

@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly logger = new Logger(MetricsService.name);
  private readonly counters = new Map<string, number>();
  private readonly gauges = new Map<string, number>();
  private readonly histograms = new Map<string, HistogramBuckets>();
  private readonly labels = new Map<string, Record<string, string>>();

  // Default histogram buckets for response times (in ms)
  private readonly defaultBuckets = [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    // Initialize default metrics
    this.initializeDefaultMetrics();
    this.logger.log('Metrics service initialized');
  }

  /**
   * Initialize default application metrics
   */
  private initializeDefaultMetrics(): void {
    // HTTP metrics
    this.createCounter('http_requests_total', { method: '', path: '', status: '' });
    this.createHistogram('http_request_duration_ms', { method: '', path: '' });

    // Database metrics
    this.createCounter('db_queries_total', { operation: '' });
    this.createHistogram('db_query_duration_ms', { operation: '' });
    this.createGauge('db_pool_connections_active', {});
    this.createGauge('db_pool_connections_idle', {});

    // Cache metrics
    this.createCounter('cache_hits_total', {});
    this.createCounter('cache_misses_total', {});

    // Business metrics
    this.createCounter('orders_created_total', { category: '' });
    this.createCounter('escrow_released_total', {});
    this.createCounter('escrow_refunded_total', {});
    this.createCounter('disputes_opened_total', {});
    this.createGauge('active_escrows_count', {});
    this.createGauge('pending_withdrawals_count', {});

    // Auth metrics
    this.createCounter('auth_login_success_total', {});
    this.createCounter('auth_login_failed_total', {});
    this.createCounter('auth_register_total', {});

    // Error metrics
    this.createCounter('errors_total', { type: '', code: '' });
  }

  /**
   * Create a counter metric
   */
  createCounter(name: string, labels: Record<string, string>): void {
    const key = this.buildKey(name, labels);
    if (!this.counters.has(key)) {
      this.counters.set(key, 0);
      this.labels.set(key, labels);
    }
  }

  /**
   * Increment a counter
   */
  incrementCounter(name: string, labels: Record<string, string> = {}, value = 1): void {
    const key = this.buildKey(name, labels);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + value);
    this.labels.set(key, labels);
  }

  /**
   * Create a gauge metric
   */
  createGauge(name: string, labels: Record<string, string>): void {
    const key = this.buildKey(name, labels);
    if (!this.gauges.has(key)) {
      this.gauges.set(key, 0);
      this.labels.set(key, labels);
    }
  }

  /**
   * Set a gauge value
   */
  setGauge(name: string, value: number, labels: Record<string, string> = {}): void {
    const key = this.buildKey(name, labels);
    this.gauges.set(key, value);
    this.labels.set(key, labels);
  }

  /**
   * Increment a gauge
   */
  incrementGauge(name: string, labels: Record<string, string> = {}, value = 1): void {
    const key = this.buildKey(name, labels);
    const current = this.gauges.get(key) || 0;
    this.gauges.set(key, current + value);
  }

  /**
   * Decrement a gauge
   */
  decrementGauge(name: string, labels: Record<string, string> = {}, value = 1): void {
    const key = this.buildKey(name, labels);
    const current = this.gauges.get(key) || 0;
    this.gauges.set(key, current - value);
  }

  /**
   * Create a histogram metric
   */
  createHistogram(name: string, labels: Record<string, string>, buckets?: number[]): void {
    const key = this.buildKey(name, labels);
    if (!this.histograms.has(key)) {
      const b = buckets || this.defaultBuckets;
      this.histograms.set(key, {
        buckets: b,
        values: new Array(b.length).fill(0),
        sum: 0,
        count: 0,
      });
      this.labels.set(key, labels);
    }
  }

  /**
   * Observe a histogram value
   */
  observeHistogram(name: string, value: number, labels: Record<string, string> = {}): void {
    const key = this.buildKey(name, labels);
    let histogram = this.histograms.get(key);

    if (!histogram) {
      this.createHistogram(name, labels);
      histogram = this.histograms.get(key)!;
    }

    histogram.sum += value;
    histogram.count += 1;

    for (let i = 0; i < histogram.buckets.length; i++) {
      if (value <= histogram.buckets[i]) {
        histogram.values[i] += 1;
      }
    }
  }

  /**
   * Record HTTP request metrics
   */
  recordHttpRequest(method: string, path: string, statusCode: number, durationMs: number): void {
    const labels = { method, path, status: statusCode.toString() };
    this.incrementCounter('http_requests_total', labels);
    this.observeHistogram('http_request_duration_ms', durationMs, { method, path });
  }

  /**
   * Record database query metrics
   */
  recordDbQuery(operation: string, durationMs: number): void {
    this.incrementCounter('db_queries_total', { operation });
    this.observeHistogram('db_query_duration_ms', durationMs, { operation });
  }

  /**
   * Record cache hit/miss
   */
  recordCacheAccess(hit: boolean): void {
    if (hit) {
      this.incrementCounter('cache_hits_total');
    } else {
      this.incrementCounter('cache_misses_total');
    }
  }

  /**
   * Record error
   */
  recordError(type: string, code: string): void {
    this.incrementCounter('errors_total', { type, code });
  }

  /**
   * Get all metrics in Prometheus format
   */
  getPrometheusMetrics(): string {
    const lines: string[] = [];
    const timestamp = Date.now();

    // Counters
    for (const [key, value] of this.counters) {
      const [name] = key.split('{');
      const labels = this.labels.get(key) || {};
      lines.push(this.formatMetric(name, 'counter', value, labels, timestamp));
    }

    // Gauges
    for (const [key, value] of this.gauges) {
      const [name] = key.split('{');
      const labels = this.labels.get(key) || {};
      lines.push(this.formatMetric(name, 'gauge', value, labels, timestamp));
    }

    // Histograms
    for (const [key, histogram] of this.histograms) {
      const [name] = key.split('{');
      const labels = this.labels.get(key) || {};

      // Bucket values
      for (let i = 0; i < histogram.buckets.length; i++) {
        const bucketLabels = { ...labels, le: histogram.buckets[i].toString() };
        lines.push(
          this.formatMetric(
            `${name}_bucket`,
            'histogram',
            histogram.values[i],
            bucketLabels,
            timestamp,
          ),
        );
      }

      // +Inf bucket
      lines.push(
        this.formatMetric(
          `${name}_bucket`,
          'histogram',
          histogram.count,
          { ...labels, le: '+Inf' },
          timestamp,
        ),
      );

      // Sum and count
      lines.push(this.formatMetric(`${name}_sum`, 'histogram', histogram.sum, labels, timestamp));
      lines.push(
        this.formatMetric(`${name}_count`, 'histogram', histogram.count, labels, timestamp),
      );
    }

    return lines.join('\n');
  }

  /**
   * Build metric key from name and labels
   */
  private buildKey(name: string, labels: Record<string, string>): string {
    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    return labelStr ? `${name}{${labelStr}}` : name;
  }

  /**
   * Format metric in Prometheus format
   */
  private formatMetric(
    name: string,
    type: string,
    value: number,
    labels: Record<string, string>,
    timestamp: number,
  ): string {
    const labelStr = Object.entries(labels)
      .filter(([, v]) => v !== '')
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    const labelPart = labelStr ? `{${labelStr}}` : '';
    return `${name}${labelPart} ${value} ${timestamp}`;
  }
}
