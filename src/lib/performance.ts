export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, wait);
  };
};

export const throttle = <T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle = false;
  let lastArgs: Parameters<T> | null = null;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
        if (lastArgs) {
          func(...lastArgs);
          lastArgs = null;
        }
      }, limit);
    } else {
      lastArgs = args;
    }
  };
};

export const requestIdleCallbackPolyfill = (
  callback: () => void,
  options?: { timeout?: number }
): ReturnType<typeof setTimeout> => {
  if ('requestIdleCallback' in window) {
    return window.requestIdleCallback(callback, options) as unknown as ReturnType<typeof setTimeout>;
  }
  return setTimeout(callback, options?.timeout || 1);
};

export const cancelIdleCallbackPolyfill = (id: ReturnType<typeof setTimeout>): void => {
  if ('cancelIdleCallback' in window) {
    window.cancelIdleCallback(id as unknown as number);
  } else {
    clearTimeout(id);
  }
};

export const measurePerformance = (name: string, callback: () => void): number => {
  const start = performance.now();
  callback();
  const end = performance.now();
  return end - start;
};

export const asyncMeasurePerformance = async (
  name: string,
  callback: () => Promise<void>
): Promise<number> => {
  const start = performance.now();
  await callback();
  const end = performance.now();
  return end - start;
};

export const chunkArray = <T>(array: T[], chunkSize: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
};

export const processInChunks = async <T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  chunkSize: number = 5,
  delayBetweenChunks: number = 0
): Promise<R[]> => {
  const chunks = chunkArray(items, chunkSize);
  const results: R[] = [];
  
  for (const chunk of chunks) {
    const chunkResults = await Promise.all(chunk.map(processor));
    results.push(...chunkResults);
    
    if (delayBetweenChunks > 0) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenChunks));
    }
  }
  
  return results;
};