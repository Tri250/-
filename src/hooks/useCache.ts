import { useState, useEffect, useCallback, useRef } from 'react';
import { cacheManager, type CachePriority } from '../lib/cacheManager';
import { imageCache, type ImageCacheOptions, type CachedImage } from '../lib/imageCache';

export interface UseCacheOptions<T> {
  namespace?: string;
  priority?: CachePriority;
  ttl?: number;
  staleWhileRevalidate?: boolean;
  revalidateOnMount?: boolean;
  revalidateOnFocus?: boolean;
  dedupingInterval?: number;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export interface UseCacheResult<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  isValidating: boolean;
  mutate: (data?: T | Promise<T>, shouldRevalidate?: boolean) => void;
  invalidate: () => void;
  revalidate: () => Promise<void>;
}

const DEFAULT_OPTIONS = {
  staleWhileRevalidate: true,
  revalidateOnMount: true,
  revalidateOnFocus: false,
  dedupingInterval: 2000,
};

const inFlightRequests = new Map<string, Promise<unknown>>();

export function useCache<T>(
  key: string | null,
  fetcher: (() => Promise<T>) | null,
  options: UseCacheOptions<T> = {}
): UseCacheResult<T> {
  const {
    namespace = 'default',
    priority = 'normal',
    ttl,
    staleWhileRevalidate = DEFAULT_OPTIONS.staleWhileRevalidate,
    revalidateOnMount = DEFAULT_OPTIONS.revalidateOnMount,
    revalidateOnFocus = DEFAULT_OPTIONS.revalidateOnFocus,
    dedupingInterval = DEFAULT_OPTIONS.dedupingInterval,
    onSuccess,
    onError,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  
  const lastFetchRef = useRef<number>(0);
  const mountedRef = useRef(true);
  const fetcherRef = useRef(fetcher);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const fetchData = useCallback(async (force = false): Promise<void> => {
    if (!key || !fetcherRef.current) return;

    const now = Date.now();
    if (!force && now - lastFetchRef.current < dedupingInterval) {
      return;
    }

    const cacheKey = `${namespace}:${key}`;
    
    if (inFlightRequests.has(cacheKey)) {
      try {
        const result = await inFlightRequests.get(cacheKey);
        if (mountedRef.current) {
          setData(result as T);
          setError(null);
          setIsLoading(false);
          onSuccessRef.current?.(result as T);
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err as Error);
          setIsLoading(false);
          onErrorRef.current?.(err as Error);
        }
      }
      return;
    }

    lastFetchRef.current = now;
    setIsValidating(true);

    const requestPromise = fetcherRef.current();
    inFlightRequests.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      
      if (mountedRef.current) {
        setData(result);
        setError(null);
        setIsLoading(false);
        onSuccessRef.current?.(result);
      }

      cacheManager.set(key, result, { namespace, priority, ttl }).catch(() => {});
    } catch (err) {
      if (mountedRef.current) {
        setError(err as Error);
        setIsLoading(false);
        onErrorRef.current?.(err as Error);
      }
    } finally {
      inFlightRequests.delete(cacheKey);
      if (mountedRef.current) {
        setIsValidating(false);
      }
    }
  }, [key, namespace, priority, ttl, dedupingInterval]);

  const mutate = useCallback((newData?: T | Promise<T>, shouldRevalidate = false) => {
    if (!key) return;

    if (newData instanceof Promise) {
      setIsValidating(true);
      newData.then((resolved) => {
        setData(resolved);
        cacheManager.set(key, resolved, { namespace, priority, ttl }).catch(() => {});
        setIsValidating(false);
      }).catch((err) => {
        setError(err);
        setIsValidating(false);
      });
    } else if (newData !== undefined) {
      setData(newData);
      cacheManager.set(key, newData, { namespace, priority, ttl }).catch(() => {});
    }

    if (shouldRevalidate) {
      fetchData(true);
    }
  }, [key, namespace, priority, ttl, fetchData]);

  const invalidate = useCallback(() => {
    if (!key) return;
    cacheManager.delete(key, { namespace }).catch(() => {});
    setData(null);
  }, [key, namespace]);

  const revalidate = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  useEffect(() => {
    mountedRef.current = true;

    if (!key || !fetcher) {
      setIsLoading(false);
      return;
    }

    const init = async () => {
      try {
        const cached = await cacheManager.get<T>(key, { namespace });
        
        if (cached !== null) {
          setData(cached);
          setIsLoading(false);
          
          if (staleWhileRevalidate || revalidateOnMount) {
            fetchData(false);
          }
        } else {
          await fetchData(false);
        }
      } catch {
        await fetchData(false);
      }
    };

    init();

    return () => {
      mountedRef.current = false;
    };
  }, [key, fetcher, namespace, staleWhileRevalidate, revalidateOnMount, fetchData]);

  useEffect(() => {
    if (!revalidateOnFocus || !key) return;

    const handleFocus = () => {
      fetchData(false);
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [key, revalidateOnFocus, fetchData]);

  return {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
    invalidate,
    revalidate,
  };
}

export interface UseCachedImageOptions extends ImageCacheOptions {
  lazy?: boolean;
  placeholder?: string;
  blurPlaceholder?: boolean;
  onLoad?: (image: CachedImage) => void;
  onError?: (error: Error) => void;
}

export interface UseCachedImageResult {
  src: string;
  isLoading: boolean;
  error: Error | null;
  width: number;
  height: number;
  reload: () => void;
}

export function useCachedImage(
  url: string | null,
  options: UseCachedImageOptions = {}
): UseCachedImageResult {
  const {
    lazy = false,
    placeholder,
    blurPlaceholder = true,
    quality,
    maxWidth,
    maxHeight,
    format,
    ttl,
    priority,
    namespace,
    onLoad,
    onError,
  } = options;

  const [src, setSrc] = useState<string>(placeholder || '');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  
  const loadedRef = useRef(false);
  const onLoadRef = useRef(onLoad);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onLoadRef.current = onLoad;
  }, [onLoad]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const loadImage = useCallback(async () => {
    if (!url || loadedRef.current) return;

    loadedRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const cachedImage = await imageCache.getImage(url, {
        quality,
        maxWidth,
        maxHeight,
        format,
        ttl,
        priority,
        namespace,
      });

      setSrc(cachedImage.objectUrl);
      setWidth(cachedImage.width);
      setHeight(cachedImage.height);
      setIsLoading(false);
      onLoadRef.current?.(cachedImage);
    } catch (err) {
      setError(err as Error);
      setIsLoading(false);
      onErrorRef.current?.(err as Error);
      if (url) {
        setSrc(url);
      }
    }
  }, [url, quality, maxWidth, maxHeight, format, ttl, priority, namespace]);

  useEffect(() => {
    loadedRef.current = false;
    setSrc(placeholder || '');
    setIsLoading(true);
    setError(null);
    setWidth(0);
    setHeight(0);

    if (!url) {
      setIsLoading(false);
      return;
    }

    if (!placeholder && blurPlaceholder) {
      const defaultPlaceholder = imageCache.getBlurPlaceholder(100, 100);
      setSrc(defaultPlaceholder);
    }

    if (lazy) {
      let observer: IntersectionObserver | null = null;
      
      const checkSupport = () => {
        if ('IntersectionObserver' in window) {
          observer = new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                if (entry.isIntersecting) {
                  loadImage();
                  observer?.disconnect();
                }
              });
            },
            { rootMargin: '200px' }
          );
          return true;
        }
        return false;
      };

      setTimeout(() => {
        if (!checkSupport()) {
          loadImage();
        }
      }, 0);

      return () => {
        observer?.disconnect();
      };
    } else {
      loadImage();
    }

    return () => {
      loadedRef.current = false;
    };
  }, [url, lazy, placeholder, blurPlaceholder, loadImage]);

  const reload = useCallback(() => {
    loadedRef.current = false;
    loadImage();
  }, [loadImage]);

  return {
    src,
    isLoading,
    error,
    width,
    height,
    reload,
  };
}

export function useCacheStats() {
  const [stats, setStats] = useState<{
    hitRate: number;
    hitCount: number;
    missCount: number;
    totalEntries: number;
    memorySize: number;
  } | null>(null);

  useEffect(() => {
    let mounted = true;
    let interval: ReturnType<typeof setInterval>;

    const updateStats = async () => {
      try {
        const s = await cacheManager.getStats();
        if (mounted) {
          setStats({
            hitRate: s.hitRate,
            hitCount: s.hitCount,
            missCount: s.missCount,
            totalEntries: s.totalEntries,
            memorySize: s.memorySize,
          });
        }
      } catch {
      }
    };

    updateStats();
    interval = setInterval(updateStats, 5000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return stats;
}

export default useCache;
