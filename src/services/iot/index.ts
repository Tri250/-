// ============================================
// IoT 服务索引
//
// 作者: 带娃的小陈工
// 日期: 2026-06-10
// 描述: IoT 设备控制服务统一导出
// ============================================

// 类型定义
export * from './types';

// MQTT 服务
export {
  MQTTService,
  createMQTTService,
  getMQTTService,
  resetMQTTService,
} from './mqttService';

// 设备管理服务
export {
  DeviceManager,
  createDeviceManager,
  getDeviceManager,
  resetDeviceManager,
} from './deviceManager';

// 地理围栏服务
export {
  GeofenceService,
  createGeofenceService,
  getGeofenceService,
  resetGeofenceService,
} from './geofenceService';