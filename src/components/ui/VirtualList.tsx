import React, { memo, useRef, useEffect, useCallback, useMemo } from 'react';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  onEndReached?: () => void;
  endReachedThreshold?: number;
  className?: string;
}

export const VirtualList = memo(<T,>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 3,
  onEndReached,
  endReachedThreshold = 0.8,
  className,
}: VirtualListProps<T>) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = React.useState(0);
  const rafRef = useRef<number>(0);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    
    rafRef.current = requestAnimationFrame(() => {
      setScrollTop(e.currentTarget.scrollTop);
    });
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const visibleRange = useMemo(() => {
    const startIdx = Math.floor(scrollTop / itemHeight);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const endIdx = startIdx + visibleCount;
    
    return {
      start: Math.max(0, startIdx - overscan),
      end: Math.min(items.length, endIdx + overscan),
    };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  useEffect(() => {
    if (onEndReached) {
      const scrollProgress = (scrollTop + containerHeight) / (items.length * itemHeight);
      if (scrollProgress >= endReachedThreshold) {
        onEndReached();
      }
    }
  }, [scrollTop, containerHeight, items.length, itemHeight, onEndReached, endReachedThreshold]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.start * itemHeight;

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end).map((item, idx) => {
      const actualIndex = visibleRange.start + idx;
      return renderItem(item, actualIndex);
    });
  }, [items, visibleRange, renderItem]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems}
        </div>
      </div>
    </div>
  );
});

VirtualList.displayName = 'VirtualList';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: React.ReactNode;
  onLoad?: () => void;
  onError?: () => void;
  threshold?: number;
}

export const LazyImage = memo(({ 
  src, 
  alt, 
  className, 
  placeholder,
  onLoad,
  onError,
  threshold = 0.1
}: LazyImageProps) => {
  const imgRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [isInView, setIsInView] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);

  useEffect(() => {
    const element = imgRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(element);
        }
      },
      { threshold }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    onError?.();
  }, [onError]);

  const defaultPlaceholder = (
    <div className="w-full h-full bg-neutral-100 dark:bg-neutral-800 animate-pulse rounded" />
  );

  return (
    <div ref={imgRef} className={className}>
      {!isLoaded && !hasError && (placeholder || defaultPlaceholder)}
      {isInView && !hasError && (
        <img
          src={src}
          alt={alt}
          className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
        />
      )}
      {hasError && (
        <div className="w-full h-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center rounded">
          <span className="text-neutral-400 text-sm">加载失败</span>
        </div>
      )}
    </div>
  );
});

LazyImage.displayName = 'LazyImage';

interface OptimizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  className?: string;
  itemClassName?: string;
  chunkSize?: number;
  initialChunkCount?: number;
  loadMoreThreshold?: number;
  onLoadMore?: () => void;
}

export const OptimizedList = memo(<T,>({
  items,
  renderItem,
  keyExtractor,
  className,
  itemClassName,
  chunkSize = 20,
  initialChunkCount = 2,
}: OptimizedListProps<T>) => {
  const [visibleCount, setVisibleCount] = React.useState(chunkSize * initialChunkCount);
  const containerRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element || visibleCount >= items.length) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount(prev => Math.min(prev + chunkSize, items.length));
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [items.length, chunkSize, visibleCount]);

  const visibleItems = useMemo(() => {
    return items.slice(0, visibleCount).map((item, index) => (
      <div key={keyExtractor(item, index)} className={itemClassName}>
        {renderItem(item, index)}
      </div>
    ));
  }, [items, visibleCount, renderItem, keyExtractor, itemClassName]);

  return (
    <div ref={containerRef} className={className}>
      {visibleItems}
      {visibleCount < items.length && (
        <div ref={loadMoreRef} className="py-4 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
});

OptimizedList.displayName = 'OptimizedList';