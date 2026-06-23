/**
 * MQTT Service - MQTT 消息协议服务
 *
 * 提供 MQTT 连接、订阅、发布、断开等完整 MQTT 客户端功能
 * 优先通过后端 API 代理操作，降级到 WebSocket 直连 MQTT Broker
 */

import { api } from '../lib/api';

// ─── 类型定义 ────────────────────────────────────────────────

export interface MQTTConnectionOptions {
  clientId?: string;
  username?: string;
  password?: string;
  keepalive?: number;
  clean?: boolean;
  will?: {
    topic: string;
    payload: string;
    qos: MQTTQoS;
    retain: boolean;
  };
  ssl?: boolean;
  rejectUnauthorized?: boolean;
}

export interface MQTTConnectionState {
  status: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'disconnecting' | 'error';
  broker: string | null;
  clientId: string | null;
  error?: string;
  timestamp: string;
  connectedAt?: string;
}

export type MQTTQoS = 0 | 1 | 2;

export interface MQTTMessage {
  id: string;
  topic: string;
  payload: string;
  qos: MQTTQoS;
  retain: boolean;
  timestamp: string;
  direction: 'incoming' | 'outgoing';
}

export interface MQTTSubscription {
  topic: string;
  qos: MQTTQoS;
  callback: (topic: string, payload: string) => void;
}

export interface MQTTPublishOptions {
  qos?: MQTTQoS;
  retain?: boolean;
  dup?: boolean;
}

// ─── MQTT API ────────────────────────────────────────────────

const mqttApi = {
  connect: (broker: string, options?: Record<string, unknown>) =>
    api.post<{ success: boolean; clientId: string }>('/iot/mqtt/connect', {
      broker,
      options,
    }),
  subscribe: (topics: Array<{ topic: string; qos: MQTTQoS }>) =>
    api.post<{ success: boolean }>('/iot/mqtt/subscribe', { topics }),
  publish: (topic: string, payload: string, options?: MQTTPublishOptions) =>
    api.post<{ success: boolean }>('/iot/mqtt/publish', {
      topic,
      payload,
      options,
    }),
  unsubscribe: (topics: string[]) =>
    api.post<{ success: boolean }>('/iot/mqtt/unsubscribe', { topics }),
  disconnect: () =>
    api.post<{ success: boolean }>('/iot/mqtt/disconnect', {}),
};

// ─── MQTT 服务类 ────────────────────────────────────────────

class MQTTService {
  private ws: WebSocket | null = null;
  private connectionState: MQTTConnectionState = {
    status: 'disconnected',
    broker: null,
    clientId: null,
    timestamp: new Date().toISOString(),
  };
  private subscriptions: MQTTSubscription[] = [];
  private messageHistory: MQTTMessage[] = [];
  private maxMessageHistory = 500;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private messageIdCounter = 0;
  private pendingMessages: Map<string, { resolve: () => void; reject: (error: Error) => void }> = new Map();

  private connectionListeners: Array<(state: MQTTConnectionState) => void> = [];
  private messageListeners: Array<(message: MQTTMessage) => void> = [];

  // ─── 连接 ──────────────────────────────────────────────────

  async connect(broker: string, options?: MQTTConnectionOptions): Promise<void> {
    if (this.connectionState.status === 'connected' || this.connectionState.status === 'connecting') {
      return;
    }

    this.connectionState = {
      status: 'connecting',
      broker,
      clientId: options?.clientId ?? this.generateClientId(),
      timestamp: new Date().toISOString(),
    };
    this.notifyConnectionChange();

    try {
      // 优先通过后端 API 连接
      const { clientId } = await mqttApi.connect(broker, options as Record<string, unknown>);
      this.connectionState = {
        status: 'connected',
        broker,
        clientId: clientId ?? this.connectionState.clientId,
        timestamp: new Date().toISOString(),
        connectedAt: new Date().toISOString(),
      };
      this.reconnectAttempts = 0;
      this.notifyConnectionChange();

      // 重新订阅之前的 topics
      if (this.subscriptions.length > 0) {
        const topics = this.subscriptions.map((s) => ({ topic: s.topic, qos: s.qos }));
        await mqttApi.subscribe(topics);
      }
    } catch (error) {
      console.warn('[MQTTService] API connect failed, falling back to WebSocket MQTT:', error);
      await this.connectViaWebSocket(broker, options);
    }
  }

  private async connectViaWebSocket(broker: string, options?: MQTTConnectionOptions): Promise<void> {
    // 构建 WebSocket MQTT URL
    const wsUrl = this.buildWebSocketUrl(broker);

    return new Promise((resolve, reject) => {
      let resolved = false;

      try {
        this.ws = new WebSocket(wsUrl, 'mqtt');
      } catch (error) {
        this.connectionState = {
          status: 'error',
          broker,
          clientId: options?.clientId ?? null,
          error: `WebSocket creation failed: ${error}`,
          timestamp: new Date().toISOString(),
        };
        this.notifyConnectionChange();
        reject(error);
        return;
      }

      this.ws.onopen = () => {
        // 发送 MQTT CONNECT 包
        const connectPacket = this.buildConnectPacket(
          this.connectionState.clientId!,
          options,
        );
        this.ws!.send(connectPacket);

        this.startPing();
        this.connectionState = {
          status: 'connected',
          broker,
          clientId: this.connectionState.clientId,
          timestamp: new Date().toISOString(),
          connectedAt: new Date().toISOString(),
        };
        this.reconnectAttempts = 0;
        this.notifyConnectionChange();

        // 重新订阅
        this.resubscribeAll();

        if (!resolved) {
          resolved = true;
          resolve();
        }
      };

      this.ws.onmessage = (event) => {
        this.handleIncomingMessage(event.data);
      };

      this.ws.onerror = (error) => {
        console.error('[MQTTService] WebSocket error:', error);
        if (!resolved) {
          resolved = true;
          this.connectionState = {
            status: 'error',
            broker,
            clientId: options?.clientId ?? null,
            error: 'WebSocket connection failed',
            timestamp: new Date().toISOString(),
          };
          this.notifyConnectionChange();
          reject(new Error('WebSocket connection failed'));
        }
      };

      this.ws.onclose = (event) => {
        this.stopPing();
        if (this.connectionState.status === 'connected') {
          this.connectionState = {
            ...this.connectionState,
            status: 'disconnected',
            timestamp: new Date().toISOString(),
          };
          this.notifyConnectionChange();

          if (!event.wasClean) {
            this.scheduleReconnect();
          }
        }
      };

      // 连接超时
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          this.connectionState = {
            status: 'error',
            broker,
            clientId: options?.clientId ?? null,
            error: 'Connection timeout',
            timestamp: new Date().toISOString(),
          };
          this.notifyConnectionChange();
          reject(new Error('Connection timeout'));
        }
      }, 10000);
    });
  }

  private buildWebSocketUrl(broker: string): string {
    // 尝试解析 broker 地址并构建 WebSocket URL
    if (broker.startsWith('ws://') || broker.startsWith('wss://')) {
      return broker;
    }

    // 从 mqtt:// 或 mqtts:// 转换
    if (broker.startsWith('mqtts://')) {
      const hostPort = broker.replace('mqtts://', '');
      return `wss://${hostPort}/mqtt`;
    }
    if (broker.startsWith('mqtt://')) {
      const hostPort = broker.replace('mqtt://', '');
      return `ws://${hostPort}/mqtt`;
    }

    // 默认
    return `wss://${broker}/mqtt`;
  }

  private buildConnectPacket(clientId: string, options?: MQTTConnectionOptions): ArrayBuffer {
    // 构建最小化的 MQTT CONNECT 包
    // MQTT v3.1.1 CONNECT 包格式
    const protocolName = 'MQTT';
    const protocolLevel = 4; // MQTT v3.1.1

    let flags = 0;
    if (options?.username) flags |= 0x80;
    if (options?.password) flags |= 0x40;
    if (options?.clean !== false) flags |= 0x02;
    if (options?.will) flags |= 0x04 | (options.will.qos << 3) | (options.will.retain ? 0x20 : 0);

    const keepalive = options?.keepalive ?? 60;
    const clientIdBytes = new TextEncoder().encode(clientId);

    // 计算可变头长度
    let remainingLength = 10 + 2 + clientIdBytes.length; // 协议名(2+4) + 协议级别(1) + 标志(1) + keepalive(2) + 客户端ID长度(2) + 客户端ID

    const usernameBytes = options?.username ? new TextEncoder().encode(options.username) : null;
    const passwordBytes = options?.password ? new TextEncoder().encode(options.password) : null;

    if (usernameBytes) remainingLength += 2 + usernameBytes.length;
    if (passwordBytes) remainingLength += 2 + passwordBytes.length;

    const buffer = new ArrayBuffer(1 + this.encodeRemainingLength(remainingLength).length + remainingLength);
    const view = new DataView(buffer);
    let offset = 0;

    // 固定头
    view.setUint8(offset++, 0x10); // CONNECT

    // 剩余长度
    const rlBytes = this.encodeRemainingLength(remainingLength);
    for (let i = 0; i < rlBytes.length; i++) {
      view.setUint8(offset++, rlBytes[i]);
    }

    // 可变头：协议名
    view.setUint16(offset, 4);
    offset += 2;
    for (let i = 0; i < 4; i++) {
      view.setUint8(offset++, protocolName.charCodeAt(i));
    }

    // 协议级别
    view.setUint8(offset++, protocolLevel);

    // 连接标志
    view.setUint8(offset++, flags);

    // Keepalive
    view.setUint16(offset, keepalive);
    offset += 2;

    // 客户端 ID
    view.setUint16(offset, clientIdBytes.length);
    offset += 2;
    new Uint8Array(buffer).set(clientIdBytes, offset);
    offset += clientIdBytes.length;

    // 用户名
    if (usernameBytes) {
      view.setUint16(offset, usernameBytes.length);
      offset += 2;
      new Uint8Array(buffer).set(usernameBytes, offset);
      offset += usernameBytes.length;
    }

    // 密码
    if (passwordBytes) {
      view.setUint16(offset, passwordBytes.length);
      offset += 2;
      new Uint8Array(buffer).set(passwordBytes, offset);
      offset += passwordBytes.length;
    }

    return buffer;
  }

  private encodeRemainingLength(length: number): number[] {
    const bytes: number[] = [];
    let remaining = length;
    do {
      let byte = remaining % 128;
      remaining = Math.floor(remaining / 128);
      if (remaining > 0) {
        byte |= 0x80;
      }
      bytes.push(byte);
    } while (remaining > 0);
    return bytes;
  }

  private buildSubscribePacket(topics: Array<{ topic: string; qos: MQTTQoS }>): ArrayBuffer {
    const packetId = this.nextMessageId();
    let remainingLength = 2; // packetId

    const topicBytesList = topics.map((t) => {
      const encoded = new TextEncoder().encode(t.topic);
      remainingLength += 2 + encoded.length + 1; // topic length + topic + qos
      return { encoded, qos: t.qos };
    });

    const rlBytes = this.encodeRemainingLength(remainingLength);
    const buffer = new ArrayBuffer(1 + rlBytes.length + remainingLength);
    const view = new DataView(buffer);
    let offset = 0;

    // 固定头
    view.setUint8(offset++, 0x82); // SUBSCRIBE

    // 剩余长度
    for (const byte of rlBytes) {
      view.setUint8(offset++, byte);
    }

    // 包 ID
    view.setUint16(offset, packetId);
    offset += 2;

    // 主题
    for (const { encoded, qos } of topicBytesList) {
      view.setUint16(offset, encoded.length);
      offset += 2;
      new Uint8Array(buffer).set(encoded, offset);
      offset += encoded.length;
      view.setUint8(offset++, qos);
    }

    return buffer;
  }

  private buildPublishPacket(
    topic: string,
    payload: string,
    options?: MQTTPublishOptions,
  ): ArrayBuffer {
    const qos = options?.qos ?? 0;
    const retain = options?.retain ? 1 : 0;
    const dup = options?.dup ? 1 : 0;

    const topicBytes = new TextEncoder().encode(topic);
    const payloadBytes = new TextEncoder().encode(payload);

    let remainingLength = 2 + topicBytes.length; // topic length + topic
    if (qos > 0) {
      remainingLength += 2; // packetId
    }
    remainingLength += payloadBytes.length;

    const fixedHeader = 0x30 | (dup << 3) | (qos << 1) | retain;
    const rlBytes = this.encodeRemainingLength(remainingLength);

    const buffer = new ArrayBuffer(1 + rlBytes.length + remainingLength);
    const view = new DataView(buffer);
    let offset = 0;

    view.setUint8(offset++, fixedHeader);
    for (const byte of rlBytes) {
      view.setUint8(offset++, byte);
    }

    view.setUint16(offset, topicBytes.length);
    offset += 2;
    new Uint8Array(buffer).set(topicBytes, offset);
    offset += topicBytes.length;

    if (qos > 0) {
      view.setUint16(offset, this.nextMessageId());
      offset += 2;
    }

    new Uint8Array(buffer).set(payloadBytes, offset);

    return buffer;
  }

  private buildUnsubscribePacket(topics: string[]): ArrayBuffer {
    const packetId = this.nextMessageId();
    let remainingLength = 2;

    const topicBytesList = topics.map((t) => {
      const encoded = new TextEncoder().encode(t);
      remainingLength += 2 + encoded.length;
      return encoded;
    });

    const rlBytes = this.encodeRemainingLength(remainingLength);
    const buffer = new ArrayBuffer(1 + rlBytes.length + remainingLength);
    const view = new DataView(buffer);
    let offset = 0;

    view.setUint8(offset++, 0xA2); // UNSUBSCRIBE
    for (const byte of rlBytes) {
      view.setUint8(offset++, byte);
    }

    view.setUint16(offset, packetId);
    offset += 2;

    for (const encoded of topicBytesList) {
      view.setUint16(offset, encoded.length);
      offset += 2;
      new Uint8Array(buffer).set(encoded, offset);
      offset += encoded.length;
    }

    return buffer;
  }

  private buildDisconnectPacket(): ArrayBuffer {
    const buffer = new ArrayBuffer(2);
    const view = new DataView(buffer);
    view.setUint8(0, 0xE0); // DISCONNECT
    view.setUint8(1, 0x00);
    return buffer;
  }

  private handleIncomingMessage(data: string | ArrayBuffer | Blob): void {
    if (typeof data === 'string') {
      // 尝试 JSON 解析
      try {
        const msg = JSON.parse(data);
        this.processIncomingMessage(msg.topic ?? 'unknown', msg.payload ?? data);
      } catch {
        this.processIncomingMessage('unknown', data);
      }
      return;
    }

    if (data instanceof ArrayBuffer) {
      this.parseMQTTPacket(new Uint8Array(data));
    } else if (data instanceof Blob) {
      data.arrayBuffer().then((buf) => {
        this.parseMQTTPacket(new Uint8Array(buf));
      }).catch(() => {});
    }
  }

  private parseMQTTPacket(data: Uint8Array): void {
    if (data.length < 2) return;

    const header = data[0];
    const type = (header >> 4) & 0x0F;

    // 跳过剩余长度
    let offset = 1;
    while (offset < data.length && (data[offset] & 0x80)) {
      offset++;
    }
    offset++;

    switch (type) {
      case 3: {
        // PUBLISH
        const topicLength = (data[offset] << 8) | data[offset + 1];
        offset += 2;
        const topic = new TextDecoder().decode(data.slice(offset, offset + topicLength));
        offset += topicLength;

        // QoS > 0 时有 packetId
        const qos = (header >> 1) & 0x03;
        if (qos > 0) {
          offset += 2;
        }

        const payload = new TextDecoder().decode(data.slice(offset));
        this.processIncomingMessage(topic, payload);
        break;
      }
      case 13: {
        // PINGRESP
        break;
      }
      default:
        break;
    }
  }

  private processIncomingMessage(topic: string, payload: string): void {
    const message: MQTTMessage = {
      id: `mqtt-${Date.now()}-${this.messageIdCounter++}`,
      topic,
      payload,
      qos: 0,
      retain: false,
      timestamp: new Date().toISOString(),
      direction: 'incoming',
    };

    this.messageHistory.push(message);
    if (this.messageHistory.length > this.maxMessageHistory) {
      this.messageHistory = this.messageHistory.slice(-this.maxMessageHistory);
    }

    // 通知订阅回调
    for (const sub of this.subscriptions) {
      if (this.topicMatches(sub.topic, topic)) {
        try {
          sub.callback(topic, payload);
        } catch {
          // 回调异常不影响其他订阅
        }
      }
    }

    this.notifyMessage(message);
  }

  private topicMatches(filter: string, topic: string): boolean {
    if (filter === topic) return true;
    if (filter === '#') return true;

    const filterParts = filter.split('/');
    const topicParts = topic.split('/');

    for (let i = 0; i < filterParts.length; i++) {
      if (filterParts[i] === '#') return true;
      if (filterParts[i] === '+') continue;
      if (i >= topicParts.length) return false;
      if (filterParts[i] !== topicParts[i]) return false;
    }

    return filterParts.length === topicParts.length;
  }

  // ─── 订阅 ──────────────────────────────────────────────────

  async subscribe(
    topic: string,
    qos: MQTTQoS = 0,
    callback: (topic: string, payload: string) => void,
  ): Promise<void> {
    // 检查是否已订阅
    const existing = this.subscriptions.find((s) => s.topic === topic && s.qos === qos);
    if (existing) {
      existing.callback = callback;
      return;
    }

    this.subscriptions.push({ topic, qos, callback });

    if (this.connectionState.status === 'connected') {
      try {
        await mqttApi.subscribe([{ topic, qos }]);
      } catch {
        // 通过 WebSocket 订阅
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(this.buildSubscribePacket([{ topic, qos }]));
        }
      }
    }
  }

  async subscribeMultiple(
    topics: Array<{ topic: string; qos: MQTTQoS }>,
    callback: (topic: string, payload: string) => void,
  ): Promise<void> {
    for (const { topic, qos } of topics) {
      const existingIdx = this.subscriptions.findIndex((s) => s.topic === topic);
      if (existingIdx >= 0) {
        this.subscriptions[existingIdx] = { topic, qos, callback };
      } else {
        this.subscriptions.push({ topic, qos, callback });
      }
    }

    if (this.connectionState.status === 'connected') {
      try {
        await mqttApi.subscribe(topics);
      } catch {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(this.buildSubscribePacket(topics));
        }
      }
    }
  }

  async unsubscribe(topic: string): Promise<void> {
    this.subscriptions = this.subscriptions.filter((s) => s.topic !== topic);

    if (this.connectionState.status === 'connected') {
      try {
        await mqttApi.unsubscribe([topic]);
      } catch {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(this.buildUnsubscribePacket([topic]));
        }
      }
    }
  }

  async unsubscribeAll(): Promise<void> {
    const topics = this.subscriptions.map((s) => s.topic);
    this.subscriptions = [];

    if (this.connectionState.status === 'connected' && topics.length > 0) {
      try {
        await mqttApi.unsubscribe(topics);
      } catch {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(this.buildUnsubscribePacket(topics));
        }
      }
    }
  }

  private async resubscribeAll(): Promise<void> {
    if (this.subscriptions.length === 0) return;

    const topics = this.subscriptions.map((s) => ({ topic: s.topic, qos: s.qos }));
    try {
      await mqttApi.subscribe(topics);
    } catch {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(this.buildSubscribePacket(topics));
      }
    }
  }

  // ─── 发布 ──────────────────────────────────────────────────

  async publish(
    topic: string,
    payload: string,
    options?: MQTTPublishOptions,
  ): Promise<void> {
    const message: MQTTMessage = {
      id: `mqtt-${Date.now()}-${this.messageIdCounter++}`,
      topic,
      payload,
      qos: options?.qos ?? 0,
      retain: options?.retain ?? false,
      timestamp: new Date().toISOString(),
      direction: 'outgoing',
    };

    this.messageHistory.push(message);
    if (this.messageHistory.length > this.maxMessageHistory) {
      this.messageHistory = this.messageHistory.slice(-this.maxMessageHistory);
    }

    if (this.connectionState.status === 'connected') {
      try {
        await mqttApi.publish(topic, payload, options);
        return;
      } catch (error) {
        console.warn('[MQTTService] API publish failed, using WebSocket:', error);
      }

      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(this.buildPublishPacket(topic, payload, options));
        return;
      }
    }

    // 队列缓存未发送的消息
    if (options?.qos && options.qos > 0) {
      this.pendingMessages.set(message.id, {
        resolve: () => {},
        reject: (err) => console.error('[MQTTService] Publish failed:', err),
      });
    }
  }

  // ─── 断开连接 ──────────────────────────────────────────────

  async disconnect(): Promise<void> {
    this.connectionState = {
      status: 'disconnecting',
      broker: this.connectionState.broker,
      clientId: this.connectionState.clientId,
      timestamp: new Date().toISOString(),
    };
    this.notifyConnectionChange();

    try {
      await mqttApi.disconnect();
    } catch {
      // 忽略
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(this.buildDisconnectPacket());
      this.ws.close(1000, 'Client disconnect');
    }

    this.stopPing();
    this.ws = null;
    this.connectionState = {
      status: 'disconnected',
      broker: null,
      clientId: null,
      timestamp: new Date().toISOString(),
    };
    this.notifyConnectionChange();
  }

  // ─── 重连 ──────────────────────────────────────────────────

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('[MQTTService] Max reconnect attempts reached');
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;

    this.connectionState = {
      ...this.connectionState,
      status: 'reconnecting',
      timestamp: new Date().toISOString(),
    };
    this.notifyConnectionChange();

    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      if (this.connectionState.broker) {
        try {
          await this.connectViaWebSocket(this.connectionState.broker);
        } catch {
          this.scheduleReconnect();
        }
      }
    }, delay);
  }

  // ─── Ping/Pong 保活 ────────────────────────────────────────

  private startPing(): void {
    this.stopPing();
    this.pingTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        const pingPacket = new ArrayBuffer(2);
        const view = new DataView(pingPacket);
        view.setUint8(0, 0xC0); // PINGREQ
        view.setUint8(1, 0x00);
        this.ws.send(pingPacket);
      }
    }, 30000);
  }

  private stopPing(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  // ─── 查询方法 ──────────────────────────────────────────────

  getConnectionState(): MQTTConnectionState {
    return { ...this.connectionState };
  }

  isConnected(): boolean {
    return this.connectionState.status === 'connected';
  }

  getSubscriptions(): MQTTSubscription[] {
    return [...this.subscriptions];
  }

  getMessageHistory(limit?: number): MQTTMessage[] {
    const messages = [...this.messageHistory];
    return limit ? messages.slice(-limit) : messages;
  }

  getMessagesByTopic(topic: string, limit?: number): MQTTMessage[] {
    const filtered = this.messageHistory.filter((m) => this.topicMatches(topic, m.topic));
    return limit ? filtered.slice(-limit) : filtered;
  }

  // ─── 事件监听器 ────────────────────────────────────────────

  onConnectionChange(listener: (state: MQTTConnectionState) => void): () => void {
    this.connectionListeners.push(listener);
    return () => {
      const idx = this.connectionListeners.indexOf(listener);
      if (idx > -1) this.connectionListeners.splice(idx, 1);
    };
  }

  onMessage(listener: (message: MQTTMessage) => void): () => void {
    this.messageListeners.push(listener);
    return () => {
      const idx = this.messageListeners.indexOf(listener);
      if (idx > -1) this.messageListeners.splice(idx, 1);
    };
  }

  // ─── 通知方法 ──────────────────────────────────────────────

  private notifyConnectionChange(): void {
    const state = { ...this.connectionState };
    this.connectionListeners.forEach((cb) => {
      try { cb(state); } catch { /* 忽略 */ }
    });
  }

  private notifyMessage(message: MQTTMessage): void {
    this.messageListeners.forEach((cb) => {
      try { cb(message); } catch { /* 忽略 */ }
    });
  }

  // ─── 工具方法 ──────────────────────────────────────────────

  private generateClientId(): string {
    const prefix = 'pawsync-iot-';
    const random = Math.random().toString(36).substring(2, 10);
    return `${prefix}${random}`;
  }

  private nextMessageId(): number {
    this.messageIdCounter = (this.messageIdCounter % 65535) + 1;
    return this.messageIdCounter;
  }

  // ─── 清理 ──────────────────────────────────────────────────

  destroy(): void {
    this.disconnect();
    this.stopPing();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.subscriptions = [];
    this.messageHistory = [];
    this.pendingMessages.clear();
    this.connectionListeners = [];
    this.messageListeners = [];
    console.log('[MQTTService] Destroyed');
  }
}

export const mqttService = new MQTTService();