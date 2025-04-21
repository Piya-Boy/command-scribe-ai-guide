interface PerformanceMetrics {
  loadTime: number;
  apiResponseTime: number;
  memoryUsage: number;
  cpuUsage: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private readonly maxMetrics = 1000; // Keep last 1000 metrics

  trackLoadTime(startTime: number) {
    const loadTime = performance.now() - startTime;
    this.addMetric({ loadTime, apiResponseTime: 0, memoryUsage: 0, cpuUsage: 0 });
  }

  trackApiResponseTime(startTime: number) {
    const apiResponseTime = performance.now() - startTime;
    this.addMetric({ loadTime: 0, apiResponseTime, memoryUsage: 0, cpuUsage: 0 });
  }

  private addMetric(metric: Partial<PerformanceMetrics>) {
    this.metrics.push({
      loadTime: metric.loadTime || 0,
      apiResponseTime: metric.apiResponseTime || 0,
      memoryUsage: metric.memoryUsage || 0,
      cpuUsage: metric.cpuUsage || 0,
    });

    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }

  getAverageMetrics(): PerformanceMetrics {
    const sum = this.metrics.reduce((acc, curr) => ({
      loadTime: acc.loadTime + curr.loadTime,
      apiResponseTime: acc.apiResponseTime + curr.apiResponseTime,
      memoryUsage: acc.memoryUsage + curr.memoryUsage,
      cpuUsage: acc.cpuUsage + curr.cpuUsage,
    }), { loadTime: 0, apiResponseTime: 0, memoryUsage: 0, cpuUsage: 0 });

    const count = this.metrics.length || 1;
    return {
      loadTime: sum.loadTime / count,
      apiResponseTime: sum.apiResponseTime / count,
      memoryUsage: sum.memoryUsage / count,
      cpuUsage: sum.cpuUsage / count,
    };
  }
}

export const performanceMonitor = new PerformanceMonitor(); 