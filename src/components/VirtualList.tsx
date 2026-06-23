import React, {
  memo,
  useRef,
  useState,
  useCallback,
  useMemo,
  useEffect,
  useLayoutEffect,
} from 'react';

interface VirtualListProps<T> {
  items: T[];
  itemKey: (item: T, index: number) => string;
  renderItem: (item: T, index: number) => React.ReactNode;
  estimatedItemHeight?: number;
  overscan?: number;
  onEndReached?: () => void;
  endReachedThreshold?: number;
  className?: string;
  itemClassName?: string;
  loading?: boolean;
  hasMore?: boolean;
  loadingComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  onScroll?: (scrollTop: number) => void;
  getScrollContainer?: () => HTMLElement | null;
}

interface ItemMetadata {
  index: number;
  top: number;
  height: number;
}

function VirtualListInner<T>({
  items,
  itemKey,
  renderItem,
  estimatedItemHeight = 80,
  overscan = 5,
  onEndReached,
  endReachedThreshold = 200,
  className = '',
  itemClassName = '',
  loading = false,
  hasMore = false,
  loadingComponent,
  emptyComponent,
  onScroll,
  getScrollContainer,
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const itemHeightsRef = useRef<Map<string, number>>(new Map());
  const itemElementsRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const rafRef = useRef<number>(0);
  const hasEndReachedRef = useRef(false);

  const [, forceUpdate] = useState({});

  const getKey = useCallback(
    (index: number) => {
      if (index < 0 || index >= items.length) return `empty-${index}`;
      return itemKey(items[index], index);
    },
    [items, itemKey]
  );

  const getItemHeight = useCallback(
    (index: number) => {
      const key = getKey(index);
      return itemHeightsRef.current.get(key) ?? estimatedItemHeight;
    },
    [getKey, estimatedItemHeight]
  );

  const getTotalHeight = useCallback(() => {
    if (items.length === 0) return 0;

    let total = 0;
    for (let i = 0; i < items.length; i++) {
      total += getItemHeight(i);
    }
    return total;
  }, [items.length, getItemHeight]);

  const getItemMetadata = useCallback(
    (index: number): ItemMetadata => {
      let top = 0;
      for (let i = 0; i < index; i++) {
        top += getItemHeight(i);
      }
      const height = getItemHeight(index);
      return { index, top, height };
    },
    [getItemHeight]
  );

  const findStartIndex = useCallback(
    (offset: number) => {
      if (items.length === 0) return 0;

      let accumulatedHeight = 0;
      for (let i = 0; i < items.length; i++) {
        const height = getItemHeight(i);
        if (accumulatedHeight + height > offset) {
          return Math.max(0, i);
        }
        accumulatedHeight += height;
      }
      return Math.max(0, items.length - 1);
    },
    [items.length, getItemHeight]
  );

  const findEndIndex = useCallback(
    (startIndex: number, viewportHeight: number) => {
      if (items.length === 0) return 0;

      let accumulatedHeight = 0;
      const startMeta = getItemMetadata(startIndex);
      accumulatedHeight = startMeta.top;

      for (let i = startIndex; i < items.length; i++) {
        accumulatedHeight += getItemHeight(i);
        if (accumulatedHeight - startMeta.top > viewportHeight) {
          return Math.min(items.length - 1, i);
        }
      }
      return items.length - 1;
    },
    [items.length, getItemHeight, getItemMetadata]
  );

  const measureItem = useCallback(
    (index: number, element: HTMLDivElement | null) => {
      const key = getKey(index);
      if (!element) {
        itemElementsRef.current.delete(key);
        return;
      }

      itemElementsRef.current.set(key, element);

      const height = element.getBoundingClientRect().height;
      const cachedHeight = itemHeightsRef.current.get(key);

      if (cachedHeight === undefined || Math.abs(cachedHeight - height) > 1) {
        itemHeightsRef.current.set(key, height);
        forceUpdate({});
      }
    },
    [getKey]
  );

  useLayoutEffect(() => {
    const updateViewport = () => {
      const container = getScrollContainer
        ? getScrollContainer()
        : containerRef.current;
      if (container) {
        setViewportHeight(container.clientHeight);
      }
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);

    return () => {
      window.removeEventListener('resize', updateViewport);
    };
  }, [getScrollContainer]);

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.currentTarget;
      const newScrollTop = target.scrollTop;

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        setScrollTop(newScrollTop);
        onScroll?.(newScrollTop);
      });

      const scrollHeight = target.scrollHeight;
      const clientHeight = target.clientHeight;
      const distanceFromBottom = scrollHeight - newScrollTop - clientHeight;

      if (
        hasMore &&
        !loading &&
        onEndReached &&
        distanceFromBottom < endReachedThreshold &&
        !hasEndReachedRef.current
      ) {
        hasEndReachedRef.current = true;
        onEndReached();
      }
    },
    [hasMore, loading, onEndReached, endReachedThreshold, onScroll]
  );

  useEffect(() => {
    if (!loading) {
      hasEndReachedRef.current = false;
    }
  }, [loading, items.length]);

  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const visibleRange = useMemo(() => {
    if (items.length === 0 || viewportHeight === 0) {
      return { start: 0, end: 0 };
    }

    const start = findStartIndex(scrollTop);
    const end = findEndIndex(start, viewportHeight);

    return {
      start: Math.max(0, start - overscan),
      end: Math.min(items.length - 1, end + overscan),
    };
  }, [scrollTop, viewportHeight, items.length, findStartIndex, findEndIndex, overscan]);

  const visibleItems = useMemo(() => {
    const result: Array<{
      item: T;
      index: number;
      top: number;
      height: number;
    }> = [];

    if (items.length === 0) return result;

    for (let i = visibleRange.start; i <= visibleRange.end; i++) {
      if (i >= 0 && i < items.length) {
        const meta = getItemMetadata(i);
        result.push({
          item: items[i],
          index: i,
          top: meta.top,
          height: meta.height,
        });
      }
    }

    return result;
  }, [items, visibleRange, getItemMetadata]);

  const totalHeight = useMemo(() => getTotalHeight(), [getTotalHeight]);

  const defaultLoadingComponent = (
    <div className="flex items-center justify-center py-6">
      <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      <span className="ml-2 text-sm text-neutral-500">加载中...</span>
    </div>
  );

  const defaultEmptyComponent = (
    <div className="flex flex-col items-center justify-center py-12 text-neutral-400">
      <p className="text-sm">暂无数据</p>
    </div>
  );

  if (items.length === 0 && !loading && emptyComponent !== null) {
    return (
      <div className={className}>
        {emptyComponent || defaultEmptyComponent}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`overflow-y-auto ${className}`}
      onScroll={handleScroll}
      style={{ height: '100%' }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(({ item, index, top, height }) => (
          <div
            key={getKey(index)}
            ref={(el) => measureItem(index, el)}
            className={itemClassName}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              transform: `translateY(${top}px)`,
              minHeight: height,
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
      {loading && (loadingComponent || defaultLoadingComponent)}
      {!hasMore && items.length > 0 && (
        <div className="flex items-center justify-center py-4 text-xs text-neutral-400">
          已加载全部
        </div>
      )}
    </div>
  );
}

VirtualListInner.displayName = 'VirtualList';

export const VirtualList = memo(VirtualListInner) as typeof VirtualListInner;

export default VirtualList;
