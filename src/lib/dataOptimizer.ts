export class DataOptimizer {
  static chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  static memoize<T extends (...args: any[]) => any>(
    func: T,
    keyFn: (...args: Parameters<T>) => string = (...args) => JSON.stringify(args)
  ): T {
    const cache = new Map<string, ReturnType<T>>();
    return ((...args: Parameters<T>) => {
      const key = keyFn(...args);
      if (cache.has(key)) {
        return cache.get(key);
      }
      const result = func(...args);
      cache.set(key, result);
      return result;
    }) as T;
  }
} 