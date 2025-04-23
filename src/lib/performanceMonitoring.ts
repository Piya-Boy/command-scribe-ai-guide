// Performance monitoring service
interface PerformanceMemory {
  usedJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface PerformanceWithMemory extends Performance {
  memory?: PerformanceMemory;
}

interface PerformanceMonitorConfig {
  enabled: boolean;
  endpoint?: string;
  memoryCheckInterval?: number;
  batchSize?: number;
  batchTimeout?: number;
}

interface MetricData {
  name: string;
  value: number;
  timestamp: string;
}

class PerformanceMonitor {
  private metricsBuffer: MetricData[] = [];
  private lastMemoryCheck: number = 0;
  private readonly memoryCheckInterval: number;
  private readonly batchSize: number;
  private readonly batchTimeout: number;
  private batchTimer: NodeJS.Timeout | null = null;
  private readonly enabled: boolean;
  private readonly endpoint?: string;
  private requestCount: number = 0;
  private readonly maxRequestsPerMinute: number = 60;

  constructor(config: PerformanceMonitorConfig = { enabled: false }) {
    this.enabled = config.enabled;
    this.endpoint = config.endpoint;
    this.memoryCheckInterval = config.memoryCheckInterval ?? 5000;
    this.batchSize = config.batchSize ?? 10;
    this.batchTimeout = config.batchTimeout ?? 5000;
  }

  private validateMetric(metric: MetricData): boolean {
    // Validate metric name
    if (!metric.name || typeof metric.name !== 'string' || metric.name.length > 100) {
      return false;
    }

    // Validate metric value
    if (typeof metric.value !== 'number' || !isFinite(metric.value)) {
      return false;
    }

    // Validate timestamp
    if (!metric.timestamp || !Date.parse(metric.timestamp)) {
      return false;
    }

    return true;
  }

  private sanitizeMetric(metric: MetricData): MetricData {
    return {
      name: metric.name.replace(/[<>]/g, ''),
      value: metric.value,
      timestamp: metric.timestamp
    };
  }

  init() {
    if (!this.enabled) return;
    
    this.trackLoadTime();
    this.setupPerformanceObserver();
    // Start memory tracking with throttling
    setInterval(() => this.trackMemoryUsage(), this.memoryCheckInterval);
  }

  trackMetric(name: string, value: number) {
    if (!this.enabled) return;

    const metric: MetricData = {
      name,
      value,
      timestamp: new Date().toISOString()
    };

    if (!this.validateMetric(metric)) {
      console.warn('Invalid metric data:', metric);
      return;
    }

    const sanitizedMetric = this.sanitizeMetric(metric);
    this.metricsBuffer.push(sanitizedMetric);

    if (this.metricsBuffer.length >= this.batchSize) {
      this.flushMetrics();
    } else if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => this.flushMetrics(), this.batchTimeout);
    }
  }

  private async flushMetrics() {
    if (!this.enabled || !this.endpoint || this.metricsBuffer.length === 0) return;

    // Check rate limit
    if (this.requestCount >= this.maxRequestsPerMinute) {
      console.warn('Rate limit exceeded for metrics sending');
      return;
    }

    const metricsToSend = [...this.metricsBuffer];
    this.metricsBuffer = [];
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    try {
      this.requestCount++;
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': await this.getCsrfToken()
        },
        body: JSON.stringify({ metrics: metricsToSend }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to send metrics:', error);
    } finally {
      // Reset rate limit counter after 1 minute
      setTimeout(() => {
        this.requestCount = Math.max(0, this.requestCount - 1);
      }, 60000);
    }
  }

  private async getCsrfToken(): Promise<string> {
    const response = await fetch('/api/csrf-token', {
      credentials: 'include'
    });
    const data = await response.json();
    return data.token;
  }

  trackLoadTime() {
    const navigationTiming = performance.getEntriesByType('navigation')[0];
    if (navigationTiming) {
      this.trackMetric('page_load_time', navigationTiming.duration);
    }
  }

  trackMemoryUsage() {
    const now = Date.now();
    if (now - this.lastMemoryCheck < this.memoryCheckInterval) return;
    
    this.lastMemoryCheck = now;
    const perf = performance as PerformanceWithMemory;
    if (perf.memory) {
      this.trackMetric('heap_size', perf.memory.usedJSHeapSize);
      this.trackMetric('heap_limit', perf.memory.jsHeapSizeLimit);
    }
  }

  setupPerformanceObserver() {
    const observer = new PerformanceObserver((list) => {
      // Only track long-running operations
      for (const entry of list.getEntries()) {
        if (entry.duration > 100) { // Only track operations taking more than 100ms
          this.trackMetric(entry.name, entry.duration);
        }
      }
    });

    observer.observe({ entryTypes: ['measure'] }); // Only track custom measures, not resources
  }

  measureOperation(name: string, operation: () => void) {
    performance.mark(`${name}_start`);
    operation();
    performance.mark(`${name}_end`);
    performance.measure(name, `${name}_start`, `${name}_end`);
  }
}

// Initialize performance monitoring with metrics disabled by default
const performanceMonitoring = new PerformanceMonitor({
  enabled: false, // Set to true and provide endpoint when ready to collect metrics
  // endpoint: '/api/metrics' // Uncomment and set your metrics endpoint when ready
});

performanceMonitoring.init();

export default performanceMonitoring; 