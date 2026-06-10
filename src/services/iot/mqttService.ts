// ============================================
// MQTT 通信服务
//
// 作者: 带娃的小陈工
// 日期: 2026-06-10
// 描述: 通过 WebSocket 代理实现 MQTT 通信，
//       支持设备指令发送和状态接收
// ============================================

import {
  DeviceCommand,
  DeviceStatus,
  MQTTConfig,
  WebSocketProxyMessage,
  IoTEventListener,
  IoTEventType,
  IoTEvent,
  CommandResult,
} from './types';

/**
 * MQTT 服务配置
 */
const DEFAULT_MQTT_CONFIG: Partial<MQTTConfig> = {
  port: 8083,
  useSSL: true,
  cleanSession: true,
  keepalive: 60,
  autoReconnect: true,
  reconnectInterval: 5000,
  maxReconnectAttempts: 10,
};

/**
 * 生成唯一ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * MQTT 服务类
 * 通过 WebSocket 代理实现 MQTT 通信（前端无法直接使用 MQTT）
 */
export class MQTTService {
  // WebSocket 连接实例
  private ws: WebSocket | null = null;
  // 服务配置
  private config: MQTTConfig;
  // 设备订阅映射
  private deviceSubscriptions: Map<string, Set<(status: DeviceStatus) => void>> = new Map();
  // 设备状态缓存
  private deviceStatusCache: Map<string, DeviceStatus> = new Map();
  // 待确认的指令
  private pendingCommands: Map<string, {
    resolve: (result: CommandResult) => void;
    reject: (error: Error) => void;
    timeout: ReturnType<typeof setTimeout>;
  }> = new Map();
  // 事件监听器
  private eventListeners: Set<IoTEventListener> = new Set();
  // 连接状态
  private connectionState: 'disconnected' | 'connecting' | 'connected' | 'error' = 'disconnected';
  // 重连计数
  private reconnectAttempts = 0;
  // 重连定时器
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  // 心跳定时器
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  // 是否已销毁
  private isDestroyed = false;

  constructor(config: MQTTConfig) {
    this.config = { ...DEFAULT_MQTT_CONFIG, ...config };
  }

  /**
   * 连接到 MQTT 代理服务器
   */
  async connect(deviceId: string): Promise<void> {
    // 如果已连接，直接返回
    if (this.connectionState === 'connected' && this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    // 如果正在连接，等待连接完成
    if (this.connectionState === 'connecting') {
      return this.waitForConnection();
    }

    return new Promise((resolve, reject) => {
      this.connectionState = 'connecting';
      
      try {
        // 构建 WebSocket URL
        const protocol = this.config.useSSL ? 'wss' : 'ws';
        const wsUrl = `${protocol}://${this.config.brokerUrl}:${this.config.port}/mqtt`;
        
        // 创建 WebSocket 连接
        this.ws = new WebSocket(wsUrl);
        
        // 连接超时处理
        const connectionTimeout = setTimeout(() => {
          if (this.connectionState === 'connecting') {
            this.ws?.close();
            reject(new Error('连接超时'));
          }
        }, 10000);

        // WebSocket 打开事件
        this.ws.onopen = () => {
          clearTimeout(connectionTimeout);
          this.connectionState = 'connected';
          this.reconnectAttempts = 0;
          
          // 发送连接消息
          this.sendProxyMessage({
            type: 'connect',
            messageId: generateId(),
            deviceId,
            timestamp: new Date(),
            payload: {
              clientId: this.config.clientId || `client-${generateId()}`,
              username: this.config.username,
              password: this.config.password,
              cleanSession: this.config.cleanSession,
              keepalive: this.config.keepalive,
            },
          });

          // 启动心跳
          this.startHeartbeat();
          
          // 触发事件
          this.emitEvent({
            type: IoTEventType.DEVICE_CONNECTED,
            data: { deviceId },
            timestamp: new Date(),
          });

          resolve();
        };

        // WebSocket 消息事件
        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        // WebSocket 错误事件
        this.ws.onerror = (error) => {
          clearTimeout(connectionTimeout);
          this.connectionState = 'error';
          
          this.emitEvent({
            type: IoTEventType.ERROR,
            data: { error: 'WebSocket 连接错误', details: error },
            timestamp: new Date(),
          });
          
          reject(new Error('WebSocket 连接错误'));
        };

        // WebSocket 关闭事件
        this.ws.onclose = () => {
          clearTimeout(connectionTimeout);
          this.handleDisconnect();
        };
      } catch (error) {
        this.connectionState = 'error';
        reject(error);
      }
    });
  }

  /**
   * 等待连接完成
   */
  private waitForConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        if (this.connectionState === 'connected') {
          clearInterval(checkInterval);
          resolve();
        } else if (this.connectionState === 'error' || this.connectionState === 'disconnected') {
          clearInterval(checkInterval);
          reject(new Error('连接失败'));
        }
      }, 100);

      // 超时处理
      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error('等待连接超时'));
      }, 10000);
    });
  }

  /**
   * 发布指令到设备
   */
  async publish(deviceId: string, command: DeviceCommand): Promise<void> {
    if (this.connectionState !== 'connected' || !this.ws) {
      throw new Error('未连接到服务器');
    }

    const topic = `device/${deviceId}/command`;
    const messageId = generateId();

    return new Promise((resolve, reject) => {
      // 设置超时
      const timeout = setTimeout(() => {
        this.pendingCommands.delete(messageId);
        reject(new Error('指令发送超时'));
      }, command.timeout || 30000);

      // 保存待确认的指令
      this.pendingCommands.set(messageId, {
        resolve: (result) => {
          clearTimeout(timeout);
          if (result.success) {
            resolve();
          } else {
            reject(new Error(result.error || '指令执行失败'));
          }
        },
        reject: (error) => {
          clearTimeout(timeout);
          reject(error);
        },
        timeout,
      });

      // 发送指令
      this.sendProxyMessage({
        type: 'publish',
        messageId,
        deviceId,
        topic,
        payload: command,
        timestamp: new Date(),
      });

      // 触发事件
      this.emitEvent({
        type: IoTEventType.COMMAND_SENT,
        data: { deviceId, command },
        timestamp: new Date(),
      });
    });
  }

  /**
   * 订阅设备状态更新
   */
  subscribe(deviceId: string, callback: (status: DeviceStatus) => void): void {
    // 添加到订阅集合
    if (!this.deviceSubscriptions.has(deviceId)) {
      this.deviceSubscriptions.set(deviceId, new Set());
      
      // 发送订阅消息
      if (this.connectionState === 'connected' && this.ws) {
        const topic = `device/${deviceId}/status`;
        this.sendProxyMessage({
          type: 'subscribe',
          messageId: generateId(),
          deviceId,
          topic,
          timestamp: new Date(),
        });
      }
    }
    
    this.deviceSubscriptions.get(deviceId)?.add(callback);

    // 如果有缓存的状态，立即回调
    const cachedStatus = this.deviceStatusCache.get(deviceId);
    if (cachedStatus) {
      callback(cachedStatus);
    }
  }

  /**
   * 取消订阅设备状态
   */
  unsubscribe(deviceId: string, callback?: (status: DeviceStatus) => void): void {
    if (!this.deviceSubscriptions.has(deviceId)) return;

    if (callback) {
      // 移除特定回调
      this.deviceSubscriptions.get(deviceId)?.delete(callback);
      
      // 如果没有回调了，发送取消订阅
      if (this.deviceSubscriptions.get(deviceId)?.size === 0) {
        this.deviceSubscriptions.delete(deviceId);
        
        if (this.connectionState === 'connected' && this.ws) {
          const topic = `device/${deviceId}/status`;
          this.sendProxyMessage({
            type: 'unsubscribe',
            messageId: generateId(),
            deviceId,
            topic,
            timestamp: new Date(),
          });
        }
      }
    } else {
      // 移除所有回调
      this.deviceSubscriptions.delete(deviceId);
      
      if (this.connectionState === 'connected' && this.ws) {
        const topic = `device/${deviceId}/status`;
        this.sendProxyMessage({
          type: 'unsubscribe',
          messageId: generateId(),
          deviceId,
          topic,
          timestamp: new Date(),
        });
      }
    }
  }

  /**
   * 断开设备连接
   */
  disconnect(deviceId: string): void {
    // 取消所有订阅
    this.unsubscribe(deviceId);
    
    // 清除缓存
    this.deviceStatusCache.delete(deviceId);
    
    // 发送断开消息
    if (this.connectionState === 'connected' && this.ws) {
      this.sendProxyMessage({
        type: 'disconnect',
        messageId: generateId(),
        deviceId,
        timestamp: new Date(),
      });
    }

    // 触发事件
    this.emitEvent({
      type: IoTEventType.DEVICE_DISCONNECTED,
      data: { deviceId },
      timestamp: new Date(),
    });
  }

  /**
   * 断开所有连接并销毁服务
   */
  destroy(): void {
    this.isDestroyed = true;
    
    // 停止心跳
    this.stopHeartbeat();
    
    // 清除重连定时器
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    // 清除所有待确认的指令
    this.pendingCommands.forEach(({ reject, timeout }) => {
      clearTimeout(timeout);
      reject(new Error('服务已销毁'));
    });
    this.pendingCommands.clear();
    
    // 清除所有订阅
    this.deviceSubscriptions.clear();
    this.deviceStatusCache.clear();
    
    // 关闭 WebSocket
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.connectionState = 'disconnected';
  }

  /**
   * 添加事件监听器
   */
  addEventListener(listener: IoTEventListener): () => void {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  /**
   * 获取当前连接状态
   */
  getConnectionState(): string {
    return this.connectionState;
  }

  /**
   * 获取设备缓存状态
   */
  getDeviceStatus(deviceId: string): DeviceStatus | undefined {
    return this.deviceStatusCache.get(deviceId);
  }

  /**
   * 发送代理消息
   */
  private sendProxyMessage(message: WebSocketProxyMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  /**
   * 处理接收到的消息
   */
  private handleMessage(data: string): void {
    try {
      const message: WebSocketProxyMessage = JSON.parse(data);
      
      switch (message.type) {
        case 'message':
          this.handleDeviceMessage(message);
          break;
        case 'status':
          this.handleStatusMessage(message);
          break;
        case 'error':
          this.handleErrorMessage(message);
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('解析消息失败:', error);
    }
  }

  /**
   * 处理设备消息
   */
  private handleDeviceMessage(message: WebSocketProxyMessage): void {
    const { deviceId, payload } = message;
    
    if (!deviceId || !payload) return;
    
    // 处理指令响应
    const commandResult = payload as CommandResult;
    if (commandResult.commandId) {
      const pending = this.pendingCommands.get(commandResult.commandId);
      if (pending) {
        this.pendingCommands.delete(commandResult.commandId);
        clearTimeout(pending.timeout);
        pending.resolve(commandResult);
        
        // 触发事件
        this.emitEvent({
          type: commandResult.success ? IoTEventType.COMMAND_COMPLETED : IoTEventType.COMMAND_FAILED,
          data: commandResult,
          timestamp: new Date(),
        });
      }
    }
    
    // 处理状态更新
    const status = payload as DeviceStatus;
    if (status.deviceId) {
      this.deviceStatusCache.set(deviceId, status);
      
      // 通知所有订阅者
      const callbacks = this.deviceSubscriptions.get(deviceId);
      callbacks?.forEach(cb => cb(status));
      
      // 触发事件
      this.emitEvent({
        type: IoTEventType.DEVICE_STATUS_UPDATE,
        data: { deviceId, status },
        timestamp: new Date(),
      });
    }
  }

  /**
   * 处理状态消息
   */
  private handleStatusMessage(message: WebSocketProxyMessage): void {
    // 处理连接状态等系统消息
    console.log('MQTT 状态:', message.payload);
  }

  /**
   * 处理错误消息
   */
  private handleErrorMessage(message: WebSocketProxyMessage): void {
    console.error('MQTT 错误:', message.error);
    
    this.emitEvent({
      type: IoTEventType.ERROR,
      data: { error: message.error },
      timestamp: new Date(),
    });
  }

  /**
   * 处理断开连接
   */
  private handleDisconnect(): void {
    const wasConnected = this.connectionState === 'connected';
    this.connectionState = 'disconnected';
    
    // 停止心跳
    this.stopHeartbeat();
    
    // 触发事件
    if (wasConnected) {
      this.emitEvent({
        type: IoTEventType.DEVICE_DISCONNECTED,
        data: { reason: 'WebSocket 连接关闭' },
        timestamp: new Date(),
      });
    }
    
    // 自动重连
    if (this.config.autoReconnect && !this.isDestroyed) {
      this.scheduleReconnect();
    }
  }

  /**
   * 安排重连
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= (this.config.maxReconnectAttempts || 10)) {
      console.error('达到最大重连次数，停止重连');
      return;
    }
    
    this.reconnectAttempts++;
    const delay = this.config.reconnectInterval || 5000;
    
    console.log(`将在 ${delay}ms 后进行第 ${this.reconnectAttempts} 次重连`);
    
    this.reconnectTimer = setTimeout(() => {
      // 尝试重新连接所有设备
      this.deviceSubscriptions.forEach((_, deviceId) => {
        this.connect(deviceId).catch(console.error);
      });
    }, delay);
  }

  /**
   * 启动心跳
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    const interval = (this.config.keepalive || 60) * 1000;
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.sendProxyMessage({
          type: 'status',
          messageId: generateId(),
          timestamp: new Date(),
          payload: { action: 'ping' },
        });
      }
    }, interval);
  }

  /**
   * 停止心跳
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * 触发事件
   */
  private emitEvent(event: IoTEvent): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('事件监听器错误:', error);
      }
    });
  }
}

/**
 * 创建 MQTT 服务实例
 */
export function createMQTTService(config: MQTTConfig): MQTTService {
  return new MQTTService(config);
}

/**
 * 默认 MQTT 服务实例
 */
let defaultMQTTService: MQTTService | null = null;

/**
 * 获取默认 MQTT 服务实例
 */
export function getMQTTService(config?: MQTTConfig): MQTTService {
  if (!defaultMQTTService && config) {
    defaultMQTTService = new MQTTService(config);
  }
  if (!defaultMQTTService) {
    throw new Error('MQTT 服务未初始化，请提供配置');
  }
  return defaultMQTTService;
}

/**
 * 重置默认 MQTT 服务实例
 */
export function resetMQTTService(): void {
  if (defaultMQTTService) {
    defaultMQTTService.destroy();
    defaultMQTTService = null;
  }
}