import { useState, useCallback, useRef, useEffect } from 'react';
import { timerManager } from '../lib/timerManager';

interface AIResponseState {
  isLoading: boolean;
  response: string | null;
  error: Error | null;
  progress: number;
}

interface UseAIResponseOptions {
  timeout?: number;
  onProgress?: (progress: number) => void;
  onComplete?: (response: string) => void;
  onError?: (error: Error) => void;
  retryCount?: number;
  retryDelay?: number;
}

export const useAIResponse = (
  fetcher: () => Promise<string>,
  options: UseAIResponseOptions = {}
) => {
  const { 
    timeout = 30000, 
    onProgress, 
    onComplete, 
    onError, 
    retryCount = 2, 
    retryDelay = 1000 
  } = options;
  
  const [state, setState] = useState<AIResponseState>({
    isLoading: false,
    response: null,
    error: null,
    progress: 0,
  });
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<string>('ai-response-timeout');
  const retryRef = useRef(0);

  const execute = useCallback(async () => {
    abortControllerRef.current = new AbortController();
    retryRef.current = 0;

    setState({ isLoading: true, response: null, error: null, progress: 0 });

    const attemptFetch = async (): Promise<string> => {
      try {
        timerManager.setTimer(timeoutRef.current, () => {
          if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            setState(prev => ({ ...prev, error: new Error('请求超时'), isLoading: false }));
          }
        }, timeout);

        if (onProgress) {
          const progressInterval = 'ai-progress-interval';
          timerManager.setTimer(progressInterval, () => {
            setState(prev => {
              const newProgress = Math.min(prev.progress + 10, 90);
              onProgress(newProgress);
              return { ...prev, progress: newProgress };
            });
          }, 500, 'interval');
        }

        const response = await fetcher();
        
        timerManager.clearTimer(timeoutRef.current);
        timerManager.clearTimer('ai-progress-interval');

        setState({ isLoading: false, response, error: null, progress: 100 });
        
        if (onComplete) {
          onComplete(response);
        }
        
        return response;
      } catch (error) {
        timerManager.clearTimer(timeoutRef.current);
        timerManager.clearTimer('ai-progress-interval');

        if (retryRef.current < retryCount) {
          retryRef.current++;
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          return attemptFetch();
        }

        const err = error instanceof Error ? error : new Error(String(error));
        setState({ isLoading: false, response: null, error: err, progress: 0 });
        
        if (onError) {
          onError(err);
        }
        
        throw err;
      }
    };

    try {
      await attemptFetch();
    } catch {
      console.error('AI response failed after retries');
    }
  }, [fetcher, timeout, onProgress, onComplete, onError, retryCount, retryDelay]);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    timerManager.clearTimer(timeoutRef.current);
    timerManager.clearTimer('ai-progress-interval');
    setState({ isLoading: false, response: null, error: null, progress: 0 });
  }, []);

  const reset = useCallback(() => {
    setState({ isLoading: false, response: null, error: null, progress: 0 });
  }, []);

  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return {
    ...state,
    execute,
    cancel,
    reset,
  };
};

interface StreamingResponseOptions {
  onChunk?: (chunk: string) => void;
  onComplete?: (fullResponse: string) => void;
  onError?: (error: Error) => void;
  chunkDelay?: number;
}

export const useStreamingResponse = (
  streamFetcher: () => Promise<ReadableStream<string>>,
  options: StreamingResponseOptions = {}
) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [response, setResponse] = useState('');
  const [error, setError] = useState<Error | null>(null);
  
  const { onChunk, onComplete, onError, chunkDelay = 50 } = options;
  const abortControllerRef = useRef<AbortController | null>(null);

  const startStream = useCallback(async () => {
    abortControllerRef.current = new AbortController();
    setIsStreaming(true);
    setResponse('');
    setError(null);

    try {
      const stream = await streamFetcher();
      const reader = stream.getReader();
      let accumulatedResponse = '';

      while (true) {
        if (abortControllerRef.current?.signal.aborted) {
          break;
        }

        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        accumulatedResponse += value;
        
        if (chunkDelay > 0) {
          await new Promise(resolve => setTimeout(resolve, chunkDelay));
        }
        
        setResponse(accumulatedResponse);
        onChunk?.(value);
      }

      setIsStreaming(false);
      onComplete?.(accumulatedResponse);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setIsStreaming(false);
      onError?.(error);
    }
  }, [streamFetcher, onChunk, onComplete, onError, chunkDelay]);

  const stopStream = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
  }, []);

  const reset = useCallback(() => {
    setResponse('');
    setError(null);
    setIsStreaming(false);
  }, []);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return {
    isStreaming,
    response,
    error,
    startStream,
    stopStream,
    reset,
  };
};

export const formatAIResponse = (response: string): string[] => {
  const paragraphs = response.split(/\n\n+/);
  return paragraphs.filter(p => p.trim().length > 0);
};

export const estimateResponseTime = (inputLength: number): number => {
  const baseTime = 1000;
  const perCharTime = 5;
  return Math.min(baseTime + inputLength * perCharTime, 8000);
};