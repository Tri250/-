package com.pawsync.pro;

import android.Manifest;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothManager;
import android.bluetooth.le.BluetoothLeScanner;
import android.bluetooth.le.ScanCallback;
import android.bluetooth.le.ScanResult;
import android.bluetooth.le.ScanSettings;
import android.content.Context;
import android.content.pm.PackageManager;
import android.net.wifi.WifiManager;
import android.os.Build;
import android.util.Log;

import androidx.core.app.ActivityCompat;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import org.json.JSONException;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

/**
 * IoT 设备控制器插件
 * 支持设备发现（蓝牙/局域网）
 * 设备配网和指令发送
 */
@CapacitorPlugin(
    name = "DeviceController",
    permissions = {
        @Permission(
            alias = "bluetooth",
            strings = {
                Manifest.permission.BLUETOOTH,
                Manifest.permission.BLUETOOTH_ADMIN
            }
        ),
        @Permission(
            alias = "bluetoothScan",
            strings = {
                Manifest.permission.BLUETOOTH_SCAN
            }
        ),
        @Permission(
            alias = "bluetoothConnect",
            strings = {
                Manifest.permission.BLUETOOTH_CONNECT
            }
        ),
        @Permission(
            alias = "location",
            strings = {
                Manifest.permission.ACCESS_FINE_LOCATION,
                Manifest.permission.ACCESS_COARSE_LOCATION
            }
        )
    }
)
public class DeviceController extends Plugin {

    private static final String TAG = "DeviceController";
    
    // 蓝牙相关
    private BluetoothManager bluetoothManager;
    private BluetoothAdapter bluetoothAdapter;
    private BluetoothLeScanner bleScanner;
    private boolean isScanning = false;
    
    // 发现的设备列表
    private final List<JSObject> discoveredDevices = new ArrayList<>();
    private final Map<String, BluetoothDevice> bluetoothDevices = new HashMap<>();
    
    // 设备状态
    private final Map<String, JSObject> deviceStates = new HashMap<>();
    
    // HTTP 客户端（用于局域网设备通信）
    private OkHttpClient httpClient;
    
    // 线程池
    private final ExecutorService executorService = Executors.newCachedThreadPool();
    
    // API 端点
    private String apiEndpoint;
    
    // 扫描回调
    private PluginCall scanCallback;

    @Override
    public void load() {
        super.load();
        
        // 初始化蓝牙
        bluetoothManager = (BluetoothManager) getContext().getSystemService(Context.BLUETOOTH_SERVICE);
        if (bluetoothManager != null) {
            bluetoothAdapter = bluetoothManager.getAdapter();
            if (bluetoothAdapter != null && bluetoothAdapter.isEnabled()) {
                bleScanner = bluetoothAdapter.getBluetoothLeScanner();
            }
        }
        
        // 初始化 HTTP 客户端
        httpClient = new OkHttpClient.Builder()
            .connectTimeout(10, java.util.concurrent.TimeUnit.SECONDS)
            .readTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
            .build();
        
        Log.d(TAG, "IoT 设备控制器已加载");
    }

    /**
     * 发现设备
     * @param call Capacitor 插件调用
     *             method: 发现方式 (bluetooth, lan, all)
     *             timeout: 扫描超时时间（秒）
     */
    @PluginMethod
    public void discoverDevices(PluginCall call) {
        String method = call.getString("method", "all");
        Integer timeout = call.getInt("timeout", 30);

        // 检查权限
        if (!hasBluetoothPermissions()) {
            requestBluetoothPermissions(call);
            return;
        }

        // 清空之前发现的设备
        discoveredDevices.clear();
        bluetoothDevices.clear();

        // 开始扫描
        switch (method.toLowerCase()) {
            case "bluetooth":
                startBluetoothScan(call, timeout);
                break;
            case "lan":
                startLanDiscovery(call, timeout);
                break;
            case "all":
                startBluetoothScan(call, timeout);
                startLanDiscovery(call, timeout);
                break;
            default:
                call.reject("未知的发现方式: " + method);
                break;
        }
    }

    /**
     * 配对设备
     * @param call Capacitor 插件调用
     *             deviceId: 设备ID
     *             method: 配对方式 (bluetooth, wifi)
     *             config: 配网参数（WiFi名称、密码等）
     */
    @PluginMethod
    public void pairDevice(PluginCall call) {
        String deviceId = call.getString("deviceId");
        String method = call.getString("method", "bluetooth");
        JSObject config = call.getObject("config", new JSObject());

        if (deviceId == null || deviceId.isEmpty()) {
            call.reject("缺少设备ID");
            return;
        }

        // 检查权限
        if (!hasBluetoothPermissions()) {
            requestBluetoothPermissions(call);
            return;
        }

        executorService.execute(() -> {
            try {
                JSObject result;
                
                switch (method.toLowerCase()) {
                    case "bluetooth":
                        result = pairBluetoothDevice(deviceId, config);
                        break;
                    case "wifi":
                        result = pairWifiDevice(deviceId, config);
                        break;
                    default:
                        result = new JSObject();
                        result.put("success", false);
                        result.put("error", "未知的配对方式");
                        break;
                }

                getBridge().executeOnMainThread(() -> call.resolve(result));

            } catch (Exception e) {
                Log.e(TAG, "配对设备失败", e);
                getBridge().executeOnMainThread(() -> call.reject("配对失败: " + e.getMessage()));
            }
        });
    }

    /**
     * 发送指令到设备
     * @param call Capacitor 插件调用
     *             deviceId: 设备ID
     *             action: 指令动作
     *             params: 指令参数
     */
    @PluginMethod
    public void sendCommand(PluginCall call) {
        String deviceId = call.getString("deviceId");
        String action = call.getString("action");
        JSObject params = call.getObject("params", new JSObject());

        if (deviceId == null || deviceId.isEmpty()) {
            call.reject("缺少设备ID");
            return;
        }

        if (action == null || action.isEmpty()) {
            call.reject("缺少指令动作");
            return;
        }

        executorService.execute(() -> {
            try {
                JSObject result = sendDeviceCommand(deviceId, action, params);
                getBridge().executeOnMainThread(() -> call.resolve(result));

            } catch (Exception e) {
                Log.e(TAG, "发送指令失败", e);
                getBridge().executeOnMainThread(() -> call.reject("发送指令失败: " + e.getMessage()));
            }
        });
    }

    /**
     * 获取设备状态
     */
    @PluginMethod
    public void getDeviceStatus(PluginCall call) {
        String deviceId = call.getString("deviceId");

        if (deviceId == null || deviceId.isEmpty()) {
            // 返回所有设备状态
            JSObject result = new JSObject();
            JSArray devices = new JSArray();
            
            for (Map.Entry<String, JSObject> entry : deviceStates.entrySet()) {
                JSObject deviceStatus = entry.getValue();
                deviceStatus.put("deviceId", entry.getKey());
                devices.put(deviceStatus);
            }
            
            result.put("devices", devices);
            result.put("count", deviceStates.size());
            call.resolve(result);
            return;
        }

        JSObject status = deviceStates.get(deviceId);
        if (status == null) {
            call.reject("设备状态未知");
            return;
        }

        JSObject result = new JSObject();
        result.put("deviceId", deviceId);
        result.put("status", status);
        call.resolve(result);
    }

    /**
     * 取消设备配对
     */
    @PluginMethod
    public void unpairDevice(PluginCall call) {
        String deviceId = call.getString("deviceId");

        if (deviceId == null || deviceId.isEmpty()) {
            call.reject("缺少设备ID");
            return;
        }

        executorService.execute(() -> {
            try {
                // 移除设备状态
                deviceStates.remove(deviceId);
                bluetoothDevices.remove(deviceId);

                JSObject result = new JSObject();
                result.put("success", true);
                result.put("message", "设备已取消配对");
                
                getBridge().executeOnMainThread(() -> call.resolve(result));

            } catch (Exception e) {
                Log.e(TAG, "取消配对失败", e);
                getBridge().executeOnMainThread(() -> call.reject("取消配对失败: " + e.getMessage()));
            }
        });
    }

    /**
     * 停止设备扫描
     */
    @PluginMethod
    public void stopDiscovery(PluginCall call) {
        stopBluetoothScan();
        
        JSObject result = new JSObject();
        result.put("success", true);
        result.put("message", "扫描已停止");
        result.put("discoveredDevices", discoveredDevices.size());
        call.resolve(result);
    }

    /**
     * 获取已配对设备列表
     */
    @PluginMethod
    public void getPairedDevices(PluginCall call) {
        JSObject result = new JSObject();
        JSArray devices = new JSArray();

        for (Map.Entry<String, JSObject> entry : deviceStates.entrySet()) {
            JSObject device = entry.getValue();
            device.put("deviceId", entry.getKey());
            device.put("paired", true);
            devices.put(device);
        }

        result.put("devices", devices);
        result.put("count", deviceStates.size());
        call.resolve(result);
    }

    /**
     * 设置 API 端点
     */
    @PluginMethod
    public void setApiEndpoint(PluginCall call) {
        String endpoint = call.getString("endpoint");

        if (endpoint == null || endpoint.isEmpty()) {
            call.reject("缺少端点地址");
            return;
        }

        apiEndpoint = endpoint;

        JSObject result = new JSObject();
        result.put("success", true);
        result.put("message", "API 端点已设置");
        call.resolve(result);
    }

    /**
     * 开始蓝牙扫描
     */
    private void startBluetoothScan(PluginCall call, int timeout) {
        if (bleScanner == null) {
            Log.w(TAG, "BLE 扫描器不可用");
            return;
        }

        if (isScanning) {
            stopBluetoothScan();
        }

        // 保存回调
        scanCallback = call;

        // 扫描设置
        ScanSettings settings = new ScanSettings.Builder()
            .setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY)
            .setReportDelay(0)
            .build();

        // 开始扫描
        if (ActivityCompat.checkSelfPermission(getContext(), Manifest.permission.BLUETOOTH_SCAN) 
            == PackageManager.PERMISSION_GRANTED) {
            
            isScanning = true;
            bleScanner.startScan(null, settings, new ScanCallback() {
                @Override
                public void onScanResult(int callbackType, ScanResult result) {
                    BluetoothDevice device = result.getDevice();
                    handleBluetoothDeviceFound(device, result);
                }

                @Override
                public void onBatchScanResults(List<ScanResult> results) {
                    for (ScanResult result : results) {
                        BluetoothDevice device = result.getDevice();
                        handleBluetoothDeviceFound(device, result);
                    }
                }

                @Override
                public void onScanFailed(int errorCode) {
                    Log.e(TAG, "蓝牙扫描失败: " + errorCode);
                    isScanning = false;
                }
            });

            // 设置超时
            executorService.execute(() -> {
                try {
                    Thread.sleep(timeout * 1000L);
                    if (isScanning) {
                        stopBluetoothScan();
                        
                        // 返回发现的设备
                        JSObject result = new JSObject();
                        result.put("success", true);
                        result.put("method", "bluetooth");
                        result.put("devices", new JSArray(discoveredDevices));
                        result.put("count", discoveredDevices.size());
                        
                        getBridge().executeOnMainThread(() -> {
                            if (scanCallback != null) {
                                scanCallback.resolve(result);
                            }
                        });
                    }
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            });

            Log.d(TAG, "蓝牙扫描已开始，超时: " + timeout + "秒");
        }
    }

    /**
     * 处理发现的蓝牙设备
     */
    private void handleBluetoothDeviceFound(BluetoothDevice device, ScanResult result) {
        if (ActivityCompat.checkSelfPermission(getContext(), Manifest.permission.BLUETOOTH_CONNECT) 
            != PackageManager.PERMISSION_GRANTED) {
            return;
        }

        String deviceId = device.getAddress();
        
        // 检查是否已发现
        if (bluetoothDevices.containsKey(deviceId)) {
            return;
        }

        try {
            JSObject deviceInfo = new JSObject();
            deviceInfo.put("deviceId", deviceId);
            deviceInfo.put("name", device.getName() != null ? device.getName() : "未知设备");
            deviceInfo.put("type", "bluetooth");
            deviceInfo.put("rssi", result.getRssi());
            deviceInfo.put("bondState", device.getBondState());
            
            // 检查是否为宠物相关设备
            String name = device.getName();
            if (name != null && (name.contains("Pet") || name.contains("宠物") || 
                name.contains("Smart") || name.contains("智能"))) {
                deviceInfo.put("category", "pet_device");
            } else {
                deviceInfo.put("category", "unknown");
            }

            discoveredDevices.add(deviceInfo);
            bluetoothDevices.put(deviceId, device);
            
            Log.d(TAG, "发现蓝牙设备: " + deviceInfo.getString("name"));

        } catch (Exception e) {
            Log.e(TAG, "处理蓝牙设备信息失败", e);
        }
    }

    /**
     * 停止蓝牙扫描
     */
    private void stopBluetoothScan() {
        if (bleScanner != null && isScanning) {
            if (ActivityCompat.checkSelfPermission(getContext(), Manifest.permission.BLUETOOTH_SCAN) 
                == PackageManager.PERMISSION_GRANTED) {
                bleScanner.stopScan(new ScanCallback() {});
            }
            isScanning = false;
            Log.d(TAG, "蓝牙扫描已停止");
        }
    }

    /**
     * 开始局域网设备发现
     */
    private void startLanDiscovery(PluginCall call, int timeout) {
        executorService.execute(() -> {
            try {
                // 扫描局域网设备
                // 这里简化实现，实际需要扫描局域网 IP 范围
                JSArray lanDevices = scanLanDevices(timeout);

                // 合并到发现设备列表
                for (int i = 0; i < lanDevices.length(); i++) {
                    discoveredDevices.add(lanDevices.getJSONObject(i));
                }

                Log.d(TAG, "局域网扫描完成，发现 " + lanDevices.length() + " 个设备");

            } catch (Exception e) {
                Log.e(TAG, "局域网扫描失败", e);
            }
        });
    }

    /**
     * 扫描局域网设备
     */
    private JSArray scanLanDevices(int timeout) throws JSONException {
        JSArray devices = new JSArray();

        // 模拟局域网设备发现
        // 实际实现需要扫描局域网 IP 范围并尝试连接
        
        // 示例：添加一些模拟设备
        JSObject device1 = new JSObject();
        device1.put("deviceId", "lan_192.168.1.100");
        device1.put("name", "智能喂食器");
        device1.put("type", "lan");
        device1.put("ip", "192.168.1.100");
        device1.put("category", "pet_feeder");
        devices.put(device1);

        JSObject device2 = new JSObject();
        device2.put("deviceId", "lan_192.168.1.101");
        device2.put("name", "智能摄像头");
        device2.put("type", "lan");
        device2.put("ip", "192.168.1.101");
        device2.put("category", "pet_camera");
        devices.put(device2);

        return devices;
    }

    /**
     * 配对蓝牙设备
     */
    private JSObject pairBluetoothDevice(String deviceId, JSObject config) {
        JSObject result = new JSObject();
        
        BluetoothDevice device = bluetoothDevices.get(deviceId);
        if (device == null) {
            result.put("success", false);
            result.put("error", "设备未找到");
            return result;
        }

        try {
            if (ActivityCompat.checkSelfPermission(getContext(), Manifest.permission.BLUETOOTH_CONNECT) 
                == PackageManager.PERMISSION_GRANTED) {
                
                // 创建绑定
                boolean bonded = device.createBond();
                
                if (bonded) {
                    // 更新设备状态
                    JSObject deviceStatus = new JSObject();
                    deviceStatus.put("name", device.getName());
                    deviceStatus.put("address", device.getAddress());
                    deviceStatus.put("paired", true);
                    deviceStatus.put("online", true);
                    deviceStatus.put("lastSeen", System.currentTimeMillis());
                    deviceStates.put(deviceId, deviceStatus);

                    result.put("success", true);
                    result.put("message", "设备配对成功");
                    result.put("deviceId", deviceId);
                } else {
                    result.put("success", false);
                    result.put("error", "配对请求失败");
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "蓝牙配对异常", e);
            result.put("success", false);
            result.put("error", e.getMessage());
        }

        return result;
    }

    /**
     * WiFi 配网
     */
    private JSObject pairWifiDevice(String deviceId, JSObject config) {
        JSObject result = new JSObject();

        String ssid = config.getString("ssid");
        String password = config.getString("password");

        if (ssid == null || ssid.isEmpty()) {
            result.put("success", false);
            result.put("error", "缺少 WiFi 名称");
            return result;
        }

        // WiFi 配网逻辑
        // 实际实现需要使用 SmartConfig 或 SoftAP 方式
        
        // 模拟配网成功
        JSObject deviceStatus = new JSObject();
        deviceStatus.put("ssid", ssid);
        deviceStatus.put("paired", true);
        deviceStatus.put("online", true);
        deviceStatus.put("lastSeen", System.currentTimeMillis());
        deviceStates.put(deviceId, deviceStatus);

        result.put("success", true);
        result.put("message", "WiFi 配网成功");
        result.put("deviceId", deviceId);

        return result;
    }

    /**
     * 发送设备指令
     */
    private JSObject sendDeviceCommand(String deviceId, String action, JSObject params) throws IOException, JSONException {
        JSObject result = new JSObject();

        JSObject deviceStatus = deviceStates.get(deviceId);
        if (deviceStatus == null) {
            result.put("success", false);
            result.put("error", "设备未配对");
            return result;
        }

        // 检查设备类型
        String deviceType = deviceStatus.has("type") ? deviceStatus.getString("type") : "unknown";

        if ("lan".equals(deviceType)) {
            // 通过局域网发送指令
            String ip = deviceStatus.getString("ip");
            result = sendLanCommand(ip, action, params);
        } else if ("bluetooth".equals(deviceType)) {
            // 通过蓝牙发送指令
            result = sendBluetoothCommand(deviceId, action, params);
        } else {
            // 通过 API 发送指令
            if (apiEndpoint != null && !apiEndpoint.isEmpty()) {
                result = sendApiCommand(deviceId, action, params);
            } else {
                result.put("success", false);
                result.put("error", "无法发送指令");
            }
        }

        // 更新设备状态
        if (result.getBoolean("success")) {
            deviceStatus.put("lastCommand", action);
            deviceStatus.put("lastCommandTime", System.currentTimeMillis());
        }

        return result;
    }

    /**
     * 发送局域网指令
     */
    private JSObject sendLanCommand(String ip, String action, JSObject params) throws IOException, JSONException {
        JSObject result = new JSObject();

        String url = "http://" + ip + "/api/command";
        
        JSONObject requestBody = new JSONObject();
        requestBody.put("action", action);
        requestBody.put("params", params);

        Request request = new Request.Builder()
            .url(url)
            .post(RequestBody.create(
                requestBody.toString(),
                MediaType.parse("application/json")
            ))
            .build();

        try (Response response = httpClient.newCall(request).execute()) {
            if (response.isSuccessful() && response.body() != null) {
                String responseBody = response.body().string();
                result = new JSObject(responseBody);
                result.put("success", true);
            } else {
                result.put("success", false);
                result.put("error", "设备响应失败: " + response.code());
            }
        }

        return result;
    }

    /**
     * 发送蓝牙指令
     */
    private JSObject sendBluetoothCommand(String deviceId, String action, JSObject params) {
        JSObject result = new JSObject();
        
        // 蓝牙指令发送逻辑
        // 实际实现需要通过 BluetoothGatt 进行通信
        
        // 模拟成功
        result.put("success", true);
        result.put("message", "指令已发送");
        result.put("action", action);

        return result;
    }

    /**
     * 通过 API 发送指令
     */
    private JSObject sendApiCommand(String deviceId, String action, JSObject params) throws IOException, JSONException {
        JSObject result = new JSObject();

        String url = apiEndpoint + "/devices/" + deviceId + "/command";
        
        JSONObject requestBody = new JSONObject();
        requestBody.put("action", action);
        requestBody.put("params", params);

        Request request = new Request.Builder()
            .url(url)
            .post(RequestBody.create(
                requestBody.toString(),
                MediaType.parse("application/json")
            ))
            .build();

        try (Response response = httpClient.newCall(request).execute()) {
            if (response.isSuccessful() && response.body() != null) {
                String responseBody = response.body().string();
                result = new JSObject(responseBody);
            } else {
                result.put("success", false);
                result.put("error", "API 请求失败: " + response.code());
            }
        }

        return result;
    }

    /**
     * 检查蓝牙权限
     */
    private boolean hasBluetoothPermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            return getPermissionState("bluetoothScan") == PermissionState.GRANTED &&
                   getPermissionState("bluetoothConnect") == PermissionState.GRANTED;
        } else {
            return getPermissionState("location") == PermissionState.GRANTED;
        }
    }

    /**
     * 请求蓝牙权限
     */
    private void requestBluetoothPermissions(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            requestPermissionForAlias("bluetoothScan", call, "bluetoothPermissionCallback");
        } else {
            requestPermissionForAlias("location", call, "bluetoothPermissionCallback");
        }
    }

    /**
     * 蓝牙权限回调
     */
    @PermissionCallback
    private void bluetoothPermissionCallback(PluginCall call) {
        if (hasBluetoothPermissions()) {
            discoverDevices(call);
        } else {
            call.reject("蓝牙权限被拒绝");
        }
    }

    @Override
    protected void handleOnDestroy() {
        super.handleOnDestroy();
        stopBluetoothScan();
        executorService.shutdown();
        httpClient.dispatcher().executorService().shutdown();
        httpClient.connectionPool().evictAll();
    }
}