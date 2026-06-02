import { useState, useEffect, useRef, useCallback } from 'react';

interface UseLazyLoadOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  delay?: number;
}

export const useLazyLoad = <T extends HTMLElement>(
  options: UseLazyLoadOptions = {}
): [React.RefObject<T>, boolean] => {
  const { threshold = 0.1, rootMargin = '100px', triggerOnce = true, delay = 0 } = options;
  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);
  const hasTriggered = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || (triggerOnce && hasTriggered.current)) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (delay > 0) {
            setTimeout(() => {
              setIsVisible(true);
              hasTriggered.current = true;
            }, delay);
          } else {
            setIsVisible(true);
            hasTriggered.current = true;
          }
          
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, rootMargin, triggerOnce, delay]);

  return [ref, isVisible];
};

interface UseLazyComponentOptions {
  delay?: number;
  condition?: boolean;
}

export const useLazyComponent = (
  loadCondition: boolean = true,
  options: UseLazyComponentOptions = {}
): [boolean, () => void] => {
  const { delay = 0 } = options;
  const [isLoaded, setIsLoaded] = useState(false);
  const loadRequested = useRef(false);

  const requestLoad = useCallback(() => {
    loadRequested.current = true;
  }, []);

  useEffect(() => {
    if (!loadCondition || !loadRequested.current) return;

    if (delay > 0) {
      const timer = setTimeout(() => {
        setIsLoaded(true);
      }, delay);
      return () => clearTimeout(timer);
    } else {
      setIsLoaded(true);
    }
  }, [loadCondition, delay]);

  return [isLoaded, requestLoad];
};

export const useDeferredLoad = <T>(
  loader: () => Promise<T>,
  deps: React.DependencyList = []
): [T | null, boolean, Error | null] => {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const loadingRef = useRef(false);

  useEffect(() => {
    if (loadingRef.current) return;
    
    loadingRef.current = true;
    setIsLoading(true);
    setError(null);

    const load = async () => {
      try {
        if ('requestIdleCallback' in window) {
          await new Promise<void>(resolve => {
            window.requestIdleCallback(() => resolve(), { timeout: 100 });
          });
        }
        
        const result = await loader();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
        loadingRef.current = false;
      }
    };

    load();
  }, deps);

  return [data, isLoading, error];
};

export const useChunkedLoad = <T>(
  items: T[],
  chunkSize: number = 10
): [T[], number, () => void] => {
  const [loadedItems, setLoadedItems] = useState<T[]>([]);
  const [currentChunk, setCurrentChunk] = useState(0);
  const totalChunks = Math.ceil(items.length / chunkSize);

  const loadNextChunk = useCallback(() => {
    if (currentChunk >= totalChunks) return;
    
    const start = currentChunk * chunkSize;
    const end = Math.min(start + chunkSize, items.length);
    const newItems = items.slice(start, end);
    
    setLoadedItems(prev => [...prev, ...newItems]);
    setCurrentChunk(prev => prev + 1);
  }, [items, chunkSize, currentChunk, totalChunks]);

  useEffect(() => {
    if (items.length > 0 && loadedItems.length === 0) {
      loadNextChunk();
    }
  }, [items]);

  return [loadedItems, currentChunk, loadNextChunk];
};