export type WorkerType = 'audio' | 'image';

interface WorkerTask<T = unknown> {
  id: string;
  type: WorkerType;
  data: unknown;
  resolve: (result: T) => void;
  reject: (error: Error) => void;
  timestamp: number;
  transferable?: Transferable[];
}

interface PoolWorker {
  worker: Worker;
  type: WorkerType;
  busy: boolean;
  currentTaskId: string | null;
}

interface WorkerPoolOptions {
  maxWorkers?: number;
  minWorkers?: number;
  taskTimeout?: number;
  enableLowEndDeviceDetection?: boolean;
}

const DEFAULT_OPTIONS: Required<WorkerPoolOptions> = {
  maxWorkers: 4,
  minWorkers: 1,
  taskTimeout: 30000,
  enableLowEndDeviceDetection: true,
};

function detectLowEndDevice(): boolean {
  try {
    const cpuCores = navigator.hardwareConcurrency || 4;
    if (cpuCores <= 2) return true;

    const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    if (deviceMemory !== undefined && deviceMemory <= 2) return true;

    const isAndroid = /Android/i.test(navigator.userAgent);
    if (isAndroid && cpuCores <= 4) return true;
  } catch {
    return false;
  }
  return false;
}

class WorkerPool {
  private workers: Map<string, PoolWorker> = new Map();
  private taskQueue: WorkerTask[] = [];
  private options: Required<WorkerPoolOptions>;
  private isLowEndDevice: boolean;
  private workerIdCounter = 0;
  private workerCreators: Map<WorkerType, () => Worker> = new Map();

  constructor(options: WorkerPoolOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.isLowEndDevice = this.options.enableLowEndDeviceDetection
      ? detectLowEndDevice()
      : false;

    if (this.isLowEndDevice) {
      this.options.maxWorkers = 1;
      this.options.minWorkers = 1;
    }
  }

  registerWorker(type: WorkerType, creator: () => Worker): void {
    this.workerCreators.set(type, creator);
  }

  private createWorker(type: WorkerType): PoolWorker | null {
    const creator = this.workerCreators.get(type);
    if (!creator) {
      console.error(`No worker creator registered for type: ${type}`);
      return null;
    }

    try {
      const worker = creator();
      const id = `worker-${type}-${++this.workerIdCounter}`;
      const poolWorker: PoolWorker = {
        worker,
        type,
        busy: false,
        currentTaskId: null,
      };

      this.workers.set(id, poolWorker);
      return poolWorker;
    } catch (error) {
      console.error(`Failed to create ${type} worker:`, error);
      return null;
    }
  }

  private getIdleWorker(type: WorkerType): PoolWorker | null {
    for (const [, poolWorker] of this.workers) {
      if (poolWorker.type === type && !poolWorker.busy) {
        return poolWorker;
      }
    }
    return null;
  }

  private getWorkerCount(type: WorkerType): number {
    let count = 0;
    for (const [, poolWorker] of this.workers) {
      if (poolWorker.type === type) {
        count++;
      }
    }
    return count;
  }

  async execute<T = unknown>(
    type: WorkerType,
    data: unknown,
    transferable?: Transferable[]
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const task: WorkerTask<T> = {
        id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        data,
        resolve: resolve as (result: unknown) => void,
        reject,
        timestamp: Date.now(),
        transferable,
      };

      this.taskQueue.push(task as WorkerTask);
      this.processQueue();
    });
  }

  private processQueue(): void {
    if (this.taskQueue.length === 0) return;

    const task = this.taskQueue[0];
    if (!task) return;

    let worker = this.getIdleWorker(task.type);

    if (!worker) {
      const currentCount = this.getWorkerCount(task.type);
      if (currentCount < this.options.maxWorkers) {
        worker = this.createWorker(task.type);
      }
    }

    if (worker && !worker.busy) {
      this.taskQueue.shift();
      this.runTask(worker, task);
    }
  }

  private runTask(poolWorker: PoolWorker, task: WorkerTask): void {
    poolWorker.busy = true;
    poolWorker.currentTaskId = task.id;

    const { worker } = poolWorker;

    const timeoutId = setTimeout(() => {
      if (poolWorker.currentTaskId === task.id) {
        this.cleanupWorker(poolWorker, task.id);
        task.reject(new Error(`Task timed out after ${this.options.taskTimeout}ms`));
        this.processQueue();
      }
    }, this.options.taskTimeout);

    const handleMessage = (e: MessageEvent) => {
      if (poolWorker.currentTaskId !== task.id) return;

      clearTimeout(timeoutId);

      if (e.data.type === 'result') {
        task.resolve(e.data.result);
      } else if (e.data.type === 'error') {
        task.reject(new Error(e.data.error || 'Unknown worker error'));
      }

      poolWorker.busy = false;
      poolWorker.currentTaskId = null;
      worker.removeEventListener('message', handleMessage);
      worker.removeEventListener('error', handleError);

      this.processQueue();
    };

    const handleError = (e: ErrorEvent) => {
      if (poolWorker.currentTaskId !== task.id) return;

      clearTimeout(timeoutId);
      task.reject(new Error(e.message || 'Worker error'));

      this.cleanupWorker(poolWorker, task.id);
      this.processQueue();
    };

    worker.addEventListener('message', handleMessage);
    worker.addEventListener('error', handleError);

    try {
      if (task.transferable && task.transferable.length > 0) {
        worker.postMessage(
          { type: 'analyze', ...task.data },
          task.transferable
        );
      } else {
        worker.postMessage({ type: 'analyze', ...task.data });
      }
    } catch (error) {
      clearTimeout(timeoutId);
      const message = error instanceof Error ? error.message : 'Failed to post message';
      task.reject(new Error(message));
      poolWorker.busy = false;
      poolWorker.currentTaskId = null;
      worker.removeEventListener('message', handleMessage);
      worker.removeEventListener('error', handleError);
      this.processQueue();
    }
  }

  private cleanupWorker(poolWorker: PoolWorker, taskId: string): void {
    if (poolWorker.currentTaskId === taskId) {
      try {
        poolWorker.worker.terminate();
      } catch {
        // ignore termination errors
      }

      for (const [id, w] of this.workers) {
        if (w === poolWorker) {
          this.workers.delete(id);
          break;
        }
      }

      poolWorker.busy = false;
      poolWorker.currentTaskId = null;
    }
  }

  terminateWorker(type?: WorkerType): void {
    for (const [id, poolWorker] of this.workers) {
      if (!type || poolWorker.type === type) {
        try {
          poolWorker.worker.terminate();
        } catch {
          // ignore
        }
        this.workers.delete(id);
      }
    }
  }

  getQueueLength(type?: WorkerType): number {
    if (!type) return this.taskQueue.length;
    return this.taskQueue.filter((t) => t.type === type).length;
  }

  getActiveWorkers(type?: WorkerType): number {
    let count = 0;
    for (const [, poolWorker] of this.workers) {
      if ((!type || poolWorker.type === type) && poolWorker.busy) {
        count++;
      }
    }
    return count;
  }

  getTotalWorkers(type?: WorkerType): number {
    let count = 0;
    for (const [, poolWorker] of this.workers) {
      if (!type || poolWorker.type === type) {
        count++;
      }
    }
    return count;
  }

  isLowEnd(): boolean {
    return this.isLowEndDevice;
  }

  clearQueue(): void {
    this.taskQueue = [];
  }

  destroy(): void {
    this.clearQueue();
    this.terminateWorker();
    this.workerCreators.clear();
  }
}

let globalPool: WorkerPool | null = null;

export function getWorkerPool(options?: WorkerPoolOptions): WorkerPool {
  if (!globalPool) {
    globalPool = new WorkerPool(options);
  }
  return globalPool;
}

export { WorkerPool };
export default WorkerPool;
