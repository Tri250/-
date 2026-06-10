package com.pawsync.pro;

import com.getcapacitor.BridgeActivity;

/**
 * 主活动类
 * 注册所有原生插件
 */
public class MainActivity extends BridgeActivity {
    
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        // 注册原生插件
        registerPlugin(GeofenceService.class);
        registerPlugin(MQTTBridge.class);
        registerPlugin(VoiceRecorderService.class);
        registerPlugin(HighlightDetector.class);
        registerPlugin(DeviceController.class);
        
        super.onCreate(savedInstanceState);
    }
}
