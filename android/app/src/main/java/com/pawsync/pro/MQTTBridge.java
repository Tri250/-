package com.pawsync.pro;

import android.util.Log;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.WebSocket;
import okhttp3.WebSocketListener;
import okio.ByteString;

/**
 * MQTT WebSocket 桥接插件
 * 通过 WebSocket 连接到 MQTT 代理
 * 支持设备指令发送和状态接收
 */
@CapacitorPlugin(name = "MQTTBridge")
public class MQTTBridge extends Plugin {

    private static final String TAG = "MQTTBridge";
    
    // WebSocket 客户端
    private OkHttpClient client;
    private WebSocket webSocket;
    
    // 连接状态
    private boolean isConnected = false;
    private String currentServerUrl;
    
    // 订阅回调映射
    private final Map<String, PluginCall> subscriptionCallbacks = new HashMap<>();
    
    // 连接回调
    private PluginCall connectionCallback;
    
    // 重连配置
    private static final int MAX_RECONNECT_ATTEMPTS = 5;
    private static final long RECONNECT_DELAY_MS = 3000;
    private int reconnectAttempts = 0;

    @Override
    public void load() {
        super.load();
        // 初始化 OkHttp 客户端
        client = new OkHttpClient.Builder()
            .pingInterval(30, TimeUnit.SECONDS)
            .readTimeout(0, TimeUnit.MILLISECONDS)
            .build();
        Log.d(TAG, "MQTT WebSocket 桥接服务已加载");
    }

    /**
     * 连接到 MQTT WebSocket 服务器
     * @param call Capacitor 插件调用
     *             serverUrl: WebSocket 服务器地址 (ws:// 或 wss://)
     *             options: 可选配置（用户名、密码等）
     */
    @PluginMethod
    public void connect(PluginCall call) {
        String serverUrl = call.getString("serverUrl");
        JSObject options = call.getObject("options", new JSObject());

        if (serverUrl == null || serverUrl.isEmpty()) {
            call.reject("缺少服务器地址");
            return;
        }

        // 如果已连接，先断开
        if (isConnected && webSocket != null) {
            disconnectInternal();
        }

        currentServerUrl = serverUrl;
        
        try {
            // 构建连接请求
            Request.Builder requestBuilder = new Request.Builder()
                .url(serverUrl);

            // 添加认证信息
            String username = options.getString("username");
            String password = options.getString("password");
            String token = options.getString("token");
            
            if (token != null && !token.isEmpty()) {
                requestBuilder.addHeader("Authorization", "Bearer " + token);
            } else if (username != null && password != null) {
                // Basic Auth
                String credential = okhttp3.Credentials.basic(username, password);
                requestBuilder.addHeader("Authorization", credential);
            }

            // 添加客户端ID
            String clientId = options.getString("clientId", "pawsync_" + UUID.randomUUID().toString());
            requestBuilder.addHeader("Client-ID", clientId);

            Request request = requestBuilder.build();

            // 创建 WebSocket 连接
            webSocket = client.newWebSocket(request, new WebSocketListener() {
                @Override
                public void onOpen(WebSocket webSocket, Response response) {
                    Log.d(TAG, "WebSocket 连接已打开");
                    isConnected = true;
                    reconnectAttempts = 0;
                    notifyConnectionStatus("connected", "连接成功");
                }

                @Override
                public void onMessage(WebSocket webSocket, String text) {
                    Log.d(TAG, "收到消息: " + text);
                    handleMessage(text);
                }

                @Override
                public void onMessage(WebSocket webSocket, ByteString bytes) {
                    Log.d(TAG, "收到二进制消息");
                    handleMessage(bytes.utf8());
                }

                @Override
                public void onClosing(WebSocket webSocket, int code, String reason) {
                    Log.d(TAG, "WebSocket 正在关闭: " + code + " - " + reason);
                    webSocket.close(1000, null);
                    isConnected = false;
                }

                @Override
                public void onClosed(WebSocket webSocket, int code, String reason) {
                    Log.d(TAG, "WebSocket 已关闭: " + code + " - " + reason);
                    isConnected = false;
                    notifyConnectionStatus("disconnected", reason);
                }

                @Override
                public void onFailure(WebSocket webSocket, Throwable t, Response response) {
                    Log.e(TAG, "WebSocket 连接失败", t);
                    isConnected = false;
                    notifyConnectionStatus("error", t.getMessage());
                    
                    // 尝试重连
                    attemptReconnect();
                }
            });

            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "正在连接...");
            result.put("clientId", clientId);
            call.resolve(result);

        } catch (Exception e) {
            Log.e(TAG, "连接异常", e);
            call.reject("连接失败: " + e.getMessage());
        }
    }

    /**
     * 发布消息到主题
     * @param call Capacitor 插件调用
     *             topic: 主题
     *             message: 消息内容
     *             qos: 服务质量等级 (0, 1, 2)
     */
    @PluginMethod
    public void publish(PluginCall call) {
        if (!isConnected || webSocket == null) {
            call.reject("未连接到服务器");
            return;
        }

        String topic = call.getString("topic");
        String message = call.getString("message");
        Integer qos = call.getInt("qos", 0);

        if (topic == null || topic.isEmpty()) {
            call.reject("缺少主题");
            return;
        }

        if (message == null) {
            call.reject("缺少消息内容");
            return;
        }

        try {
            // 构建 MQTT 发布消息格式
            JSObject publishMsg = new JSObject();
            publishMsg.put("type", "publish");
            publishMsg.put("topic", topic);
            publishMsg.put("payload", message);
            publishMsg.put("qos", qos);
            publishMsg.put("messageId", UUID.randomUUID().toString());

            boolean sent = webSocket.send(publishMsg.toString());

            if (sent) {
                JSObject result = new JSObject();
                result.put("success", true);
                result.put("messageId", publishMsg.getString("messageId"));
                call.resolve(result);
                Log.d(TAG, "消息已发布到主题: " + topic);
            } else {
                call.reject("消息发送失败");
            }
        } catch (Exception e) {
            Log.e(TAG, "发布消息异常", e);
            call.reject("发布失败: " + e.getMessage());
        }
    }

    /**
     * 订阅主题
     * @param call Capacitor 插件调用
     *             topic: 主题
     *             qos: 服务质量等级
     */
    @PluginMethod(returnType = PluginMethod.RETURN_CALLBACK)
    public void subscribe(PluginCall call) {
        if (!isConnected || webSocket == null) {
            call.reject("未连接到服务器");
            return;
        }

        String topic = call.getString("topic");
        Integer qos = call.getInt("qos", 0);

        if (topic == null || topic.isEmpty()) {
            call.reject("缺少主题");
            return;
        }

        try {
            // 构建 MQTT 订阅消息格式
            JSObject subscribeMsg = new JSObject();
            subscribeMsg.put("type", "subscribe");
            subscribeMsg.put("topic", topic);
            subscribeMsg.put("qos", qos);
            subscribeMsg.put("subscriptionId", UUID.randomUUID().toString());

            boolean sent = webSocket.send(subscribeMsg.toString());

            if (sent) {
                // 保存回调
                call.setKeepAlive(true);
                subscriptionCallbacks.put(topic, call);

                JSObject result = new JSObject();
                result.put("success", true);
                result.put("topic", topic);
                result.put("subscriptionId", subscribeMsg.getString("subscriptionId"));
                call.resolve(result);
                Log.d(TAG, "已订阅主题: " + topic);
            } else {
                call.reject("订阅请求发送失败");
            }
        } catch (Exception e) {
            Log.e(TAG, "订阅异常", e);
            call.reject("订阅失败: " + e.getMessage());
        }
    }

    /**
     * 取消订阅
     * @param call Capacitor 插件调用
     *             topic: 主题
     */
    @PluginMethod
    public void unsubscribe(PluginCall call) {
        String topic = call.getString("topic");

        if (topic == null || topic.isEmpty()) {
            call.reject("缺少主题");
            return;
        }

        if (!isConnected || webSocket == null) {
            // 即使未连接也移除回调
            subscriptionCallbacks.remove(topic);
            call.resolve();
            return;
        }

        try {
            // 构建 MQTT 取消订阅消息格式
            JSObject unsubscribeMsg = new JSObject();
            unsubscribeMsg.put("type", "unsubscribe");
            unsubscribeMsg.put("topic", topic);

            webSocket.send(unsubscribeMsg.toString());
            subscriptionCallbacks.remove(topic);

            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "已取消订阅");
            call.resolve(result);
            Log.d(TAG, "已取消订阅主题: " + topic);
        } catch (Exception e) {
            Log.e(TAG, "取消订阅异常", e);
            call.reject("取消订阅失败: " + e.getMessage());
        }
    }

    /**
     * 断开连接
     */
    @PluginMethod
    public void disconnect(PluginCall call) {
        try {
            disconnectInternal();
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "已断开连接");
            call.resolve(result);
        } catch (Exception e) {
            call.reject("断开连接失败: " + e.getMessage());
        }
    }

    /**
     * 检查连接状态
     */
    @PluginMethod
    public void isConnected(PluginCall call) {
        JSObject result = new JSObject();
        result.put("connected", isConnected);
        result.put("serverUrl", currentServerUrl != null ? currentServerUrl : "");
        call.resolve(result);
    }

    /**
     * 注册连接状态回调
     */
    @PluginMethod(returnType = PluginMethod.RETURN_CALLBACK)
    public void onConnectionChange(PluginCall call) {
        call.setKeepAlive(true);
        connectionCallback = call;
        
        JSObject result = new JSObject();
        result.put("success", true);
        call.resolve(result);
    }

    /**
     * 内部断开连接方法
     */
    private void disconnectInternal() {
        if (webSocket != null) {
            webSocket.close(1000, "客户端主动断开");
            webSocket = null;
        }
        isConnected = false;
        subscriptionCallbacks.clear();
        reconnectAttempts = 0;
    }

    /**
     * 处理收到的消息
     */
    private void handleMessage(String message) {
        try {
            JSObject msg = new JSObject(message);
            String type = msg.getString("type");
            String topic = msg.getString("topic");
            String payload = msg.getString("payload");

            // 触发订阅回调
            if ("message".equals(type) && topic != null) {
                PluginCall callback = subscriptionCallbacks.get(topic);
                if (callback != null) {
                    JSObject result = new JSObject();
                    result.put("topic", topic);
                    result.put("payload", payload);
                    result.put("timestamp", System.currentTimeMillis());
                    callback.resolve(result);
                }
                
                // 也检查通配符订阅
                for (Map.Entry<String, PluginCall> entry : subscriptionCallbacks.entrySet()) {
                    String subTopic = entry.getKey();
                    if (isTopicMatch(topic, subTopic) && !subTopic.equals(topic)) {
                        JSObject result = new JSObject();
                        result.put("topic", topic);
                        result.put("payload", payload);
                        result.put("timestamp", System.currentTimeMillis());
                        entry.getValue().resolve(result);
                    }
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "解析消息异常", e);
        }
    }

    /**
     * 主题匹配（支持通配符）
     */
    private boolean isTopicMatch(String topic, String pattern) {
        if (pattern.equals("#")) return true;
        if (pattern.endsWith("/#")) {
            String prefix = pattern.substring(0, pattern.length() - 2);
            return topic.startsWith(prefix);
        }
        if (pattern.contains("+")) {
            String regex = pattern.replace("+", "[^/]+");
            return topic.matches(regex);
        }
        return topic.equals(pattern);
    }

    /**
     * 通知连接状态变化
     */
    private void notifyConnectionStatus(String status, String message) {
        if (connectionCallback != null) {
            JSObject result = new JSObject();
            result.put("status", status);
            result.put("message", message);
            result.put("timestamp", System.currentTimeMillis());
            connectionCallback.resolve(result);
        }
    }

    /**
     * 尝试重连
     */
    private void attemptReconnect() {
        if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            Log.w(TAG, "已达到最大重连次数");
            notifyConnectionStatus("failed", "连接失败，已达到最大重连次数");
            return;
        }

        reconnectAttempts++;
        Log.d(TAG, "尝试重连 (" + reconnectAttempts + "/" + MAX_RECONNECT_ATTEMPTS + ")");

        new Thread(() -> {
            try {
                Thread.sleep(RECONNECT_DELAY_MS);
                if (currentServerUrl != null && !isConnected) {
                    // 这里可以触发重新连接
                    notifyConnectionStatus("reconnecting", "正在重连... 第 " + reconnectAttempts + " 次");
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }).start();
    }

    @Override
    protected void handleOnDestroy() {
        super.handleOnDestroy();
        disconnectInternal();
        if (client != null) {
            client.dispatcher().executorService().shutdown();
            client.connectionPool().evictAll();
        }
    }
}