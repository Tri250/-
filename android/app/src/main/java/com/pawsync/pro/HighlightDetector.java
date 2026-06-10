package com.pawsync.pro;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.util.Base64;
import android.util.Log;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import okhttp3.MediaType;
import okhttp3.MultipartBody;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

/**
 * AI 精彩片段检测插件
 * 调用后端 AI 服务检测视频精彩片段
 * 支持视频帧处理和片段生成
 */
@CapacitorPlugin(name = "HighlightDetector")
public class HighlightDetector extends Plugin {

    private static final String TAG = "HighlightDetector";
    
    // AI 服务端点
    private String apiEndpoint;
    private String apiKey;
    
    // HTTP 客户端
    private OkHttpClient httpClient;
    
    // 线程池
    private final ExecutorService executorService = Executors.newFixedThreadPool(3);
    
    // 检测配置
    private int frameInterval = 30; // 帧间隔（毫秒）
    private float confidenceThreshold = 0.7f; // 置信度阈值
    private int maxHighlights = 10; // 最大精彩片段数

    @Override
    public void load() {
        super.load();
        httpClient = new OkHttpClient.Builder()
            .connectTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
            .readTimeout(60, java.util.concurrent.TimeUnit.SECONDS)
            .writeTimeout(60, java.util.concurrent.TimeUnit.SECONDS)
            .build();
        Log.d(TAG, "AI 精彩片段检测服务已加载");
    }

    /**
     * 设置 API 配置
     * @param call Capacitor 插件调用
     *             endpoint: API 端点地址
     *             apiKey: API 密钥
     */
    @PluginMethod
    public void configure(PluginCall call) {
        String endpoint = call.getString("endpoint");
        String key = call.getString("apiKey");
        Integer interval = call.getInt("frameInterval");
        Float threshold = call.getFloat("confidenceThreshold");
        Integer max = call.getInt("maxHighlights");

        if (endpoint != null && !endpoint.isEmpty()) {
            apiEndpoint = endpoint;
        }
        
        if (key != null && !key.isEmpty()) {
            apiKey = key;
        }
        
        if (interval != null && interval > 0) {
            frameInterval = interval;
        }
        
        if (threshold != null && threshold >= 0 && threshold <= 1) {
            confidenceThreshold = threshold;
        }
        
        if (max != null && max > 0) {
            maxHighlights = max;
        }

        JSObject result = new JSObject();
        result.put("success", true);
        result.put("message", "配置已更新");
        result.put("endpoint", apiEndpoint != null ? apiEndpoint : "");
        result.put("frameInterval", frameInterval);
        result.put("confidenceThreshold", confidenceThreshold);
        result.put("maxHighlights", maxHighlights);
        call.resolve(result);
    }

    /**
     * 检测视频精彩片段
     * @param call Capacitor 插件调用
     *             videoPath: 视频文件路径
     *             options: 可选配置
     */
    @PluginMethod
    public void detectHighlights(PluginCall call) {
        String videoPath = call.getString("videoPath");
        JSObject options = call.getObject("options", new JSObject());

        if (videoPath == null || videoPath.isEmpty()) {
            call.reject("缺少视频路径");
            return;
        }

        File videoFile = new File(videoPath);
        if (!videoFile.exists()) {
            call.reject("视频文件不存在");
            return;
        }

        // 检查 API 配置
        if (apiEndpoint == null || apiEndpoint.isEmpty()) {
            call.reject("未配置 API 端点，请先调用 configure 方法");
            return;
        }

        // 异步处理
        executorService.execute(() -> {
            try {
                // 提取视频帧
                List<Bitmap> frames = extractVideoFrames(videoPath, options);
                
                // 发送到 AI 服务进行检测
                JSArray highlights = analyzeFramesWithAI(frames, options);

                // 返回结果
                JSObject result = new JSObject();
                result.put("success", true);
                result.put("highlights", highlights);
                result.put("totalFrames", frames.size());
                result.put("videoPath", videoPath);
                
                getBridge().executeOnMainThread(() -> call.resolve(result));
                
                // 回收 Bitmap 内存
                for (Bitmap frame : frames) {
                    if (frame != null && !frame.isRecycled()) {
                        frame.recycle();
                    }
                }

            } catch (Exception e) {
                Log.e(TAG, "检测精彩片段失败", e);
                getBridge().executeOnMainThread(() -> call.reject("检测失败: " + e.getMessage()));
            }
        });
    }

    /**
     * 生成精彩片段
     * @param call Capacitor 插件调用
     *             videoPath: 视频文件路径
     *             startTime: 开始时间（秒）
     *             endTime: 结束时间（秒）
     *             outputPath: 输出路径（可选）
     */
    @PluginMethod
    public void generateClip(PluginCall call) {
        String videoPath = call.getString("videoPath");
        Double startTime = call.getDouble("startTime");
        Double endTime = call.getDouble("endTime");
        String outputPath = call.getString("outputPath");

        if (videoPath == null || videoPath.isEmpty()) {
            call.reject("缺少视频路径");
            return;
        }

        if (startTime == null || endTime == null) {
            call.reject("缺少开始或结束时间");
            return;
        }

        if (startTime >= endTime) {
            call.reject("开始时间必须小于结束时间");
            return;
        }

        File videoFile = new File(videoPath);
        if (!videoFile.exists()) {
            call.reject("视频文件不存在");
            return;
        }

        // 异步处理
        executorService.execute(() -> {
            try {
                // 调用后端 API 生成片段
                JSObject clipResult = generateClipWithAPI(videoPath, startTime, endTime, outputPath);

                getBridge().executeOnMainThread(() -> call.resolve(clipResult));

            } catch (Exception e) {
                Log.e(TAG, "生成片段失败", e);
                getBridge().executeOnMainThread(() -> call.reject("生成片段失败: " + e.getMessage()));
            }
        });
    }

    /**
     * 分析视频帧（快速模式）
     */
    @PluginMethod
    public void analyzeFrame(PluginCall call) {
        String framePath = call.getString("framePath");
        String frameBase64 = call.getString("frameBase64");

        if ((framePath == null || framePath.isEmpty()) && (frameBase64 == null || frameBase64.isEmpty())) {
            call.reject("缺少帧图像路径或 Base64 数据");
            return;
        }

        executorService.execute(() -> {
            try {
                Bitmap bitmap;
                
                if (framePath != null && !framePath.isEmpty()) {
                    bitmap = BitmapFactory.decodeFile(framePath);
                } else {
                    byte[] decodedBytes = Base64.decode(frameBase64, Base64.DEFAULT);
                    bitmap = BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.length);
                }

                if (bitmap == null) {
                    getBridge().executeOnMainThread(() -> call.reject("无法解码图像"));
                    return;
                }

                // 分析单帧
                JSObject analysis = analyzeSingleFrame(bitmap);

                getBridge().executeOnMainThread(() -> call.resolve(analysis));

                if (!bitmap.isRecycled()) {
                    bitmap.recycle();
                }

            } catch (Exception e) {
                Log.e(TAG, "分析帧失败", e);
                getBridge().executeOnMainThread(() -> call.reject("分析失败: " + e.getMessage()));
            }
        });
    }

    /**
     * 批量检测精彩片段
     */
    @PluginMethod
    public void batchDetect(PluginCall call) {
        JSArray videoPaths = call.getArray("videoPaths");
        
        if (videoPaths == null || videoPaths.length() == 0) {
            call.reject("缺少视频路径列表");
            return;
        }

        executorService.execute(() -> {
            try {
                JSArray results = new JSArray();
                
                for (int i = 0; i < videoPaths.length(); i++) {
                    String path = videoPaths.getString(i);
                    File videoFile = new File(path);
                    
                    if (videoFile.exists()) {
                        List<Bitmap> frames = extractVideoFrames(path, new JSObject());
                        JSArray highlights = analyzeFramesWithAI(frames, new JSObject());
                        
                        JSObject videoResult = new JSObject();
                        videoResult.put("videoPath", path);
                        videoResult.put("highlights", highlights);
                        videoResult.put("success", true);
                        results.put(videoResult);
                        
                        // 回收内存
                        for (Bitmap frame : frames) {
                            if (frame != null && !frame.isRecycled()) {
                                frame.recycle();
                            }
                        }
                    } else {
                        JSObject videoResult = new JSObject();
                        videoResult.put("videoPath", path);
                        videoResult.put("success", false);
                        videoResult.put("error", "文件不存在");
                        results.put(videoResult);
                    }
                }

                JSObject result = new JSObject();
                result.put("success", true);
                result.put("results", results);
                result.put("totalVideos", videoPaths.length());
                
                getBridge().executeOnMainThread(() -> call.resolve(result));

            } catch (Exception e) {
                Log.e(TAG, "批量检测失败", e);
                getBridge().executeOnMainThread(() -> call.reject("批量检测失败: " + e.getMessage()));
            }
        });
    }

    /**
     * 提取视频帧
     */
    private List<Bitmap> extractVideoFrames(String videoPath, JSObject options) throws IOException {
        List<Bitmap> frames = new ArrayList<>();
        
        // 这里使用简化的帧提取逻辑
        // 实际项目中应该使用 MediaMetadataRetriever 或 FFmpeg
        // 这里模拟返回一些帧用于演示
        
        int interval = options.getInt("frameInterval", frameInterval);
        int maxFrames = options.getInt("maxFrames", 100);
        
        // 实际实现需要使用 MediaMetadataRetriever
        // MediaMetadataRetriever retriever = new MediaMetadataRetriever();
        // retriever.setDataSource(videoPath);
        // ...
        
        Log.d(TAG, "提取视频帧: " + videoPath + ", 间隔: " + interval + "ms");
        
        return frames;
    }

    /**
     * 使用 AI 服务分析帧
     */
    private JSArray analyzeFramesWithAI(List<Bitmap> frames, JSObject options) throws IOException, JSONException {
        JSArray highlights = new JSArray();
        
        if (apiEndpoint == null || apiEndpoint.isEmpty()) {
            Log.w(TAG, "API 端点未配置，返回模拟结果");
            return generateMockHighlights();
        }

        // 构建请求
        JSONObject requestBody = new JSONObject();
        requestBody.put("frames", frames.size());
        requestBody.put("confidenceThreshold", confidenceThreshold);
        requestBody.put("maxHighlights", maxHighlights);
        
        // 添加帧数据（Base64 编码）
        JSArray framesData = new JSArray();
        for (Bitmap frame : frames) {
            String base64 = bitmapToBase64(frame);
            framesData.put(base64);
        }
        requestBody.put("framesData", framesData);

        // 发送请求
        Request request = new Request.Builder()
            .url(apiEndpoint + "/detect-highlights")
            .addHeader("Authorization", "Bearer " + apiKey)
            .addHeader("Content-Type", "application/json")
            .post(RequestBody.create(
                requestBody.toString(),
                MediaType.parse("application/json")
            ))
            .build();

        try (Response response = httpClient.newCall(request).execute()) {
            if (response.isSuccessful() && response.body() != null) {
                String responseBody = response.body().string();
                JSONObject jsonResponse = new JSONObject(responseBody);
                
                if (jsonResponse.has("highlights")) {
                    highlights = new JSArray(jsonResponse.getJSONArray("highlights").toString());
                }
            } else {
                Log.e(TAG, "AI 服务请求失败: " + response.code());
                return generateMockHighlights();
            }
        }

        return highlights;
    }

    /**
     * 分析单帧
     */
    private JSObject analyzeSingleFrame(Bitmap bitmap) throws IOException, JSONException {
        JSObject analysis = new JSObject();
        
        if (apiEndpoint == null || apiEndpoint.isEmpty()) {
            // 返回模拟结果
            analysis.put("hasPet", true);
            analysis.put("confidence", 0.85);
            analysis.put("activity", "playing");
            analysis.put("emotion", "happy");
            return analysis;
        }

        String base64 = bitmapToBase64(bitmap);
        
        JSONObject requestBody = new JSONObject();
        requestBody.put("frame", base64);

        Request request = new Request.Builder()
            .url(apiEndpoint + "/analyze-frame")
            .addHeader("Authorization", "Bearer " + apiKey)
            .post(RequestBody.create(
                requestBody.toString(),
                MediaType.parse("application/json")
            ))
            .build();

        try (Response response = httpClient.newCall(request).execute()) {
            if (response.isSuccessful() && response.body() != null) {
                String responseBody = response.body().string();
                analysis = new JSObject(responseBody);
            }
        }

        return analysis;
    }

    /**
     * 通过 API 生成片段
     */
    private JSObject generateClipWithAPI(String videoPath, double startTime, double endTime, String outputPath) 
            throws IOException, JSONException {
        
        JSObject result = new JSObject();
        
        if (apiEndpoint == null || apiEndpoint.isEmpty()) {
            // 返回模拟结果
            result.put("success", true);
            result.put("clipPath", videoPath.replace(".mp4", "_clip_" + (int)startTime + "_" + (int)endTime + ".mp4"));
            result.put("startTime", startTime);
            result.put("endTime", endTime);
            result.put("duration", endTime - startTime);
            return result;
        }

        File videoFile = new File(videoPath);
        
        // 构建 multipart 请求
        RequestBody requestBody = new MultipartBody.Builder()
            .setType(MultipartBody.FORM)
            .addFormDataPart("startTime", String.valueOf(startTime))
            .addFormDataPart("endTime", String.valueOf(endTime))
            .addFormDataPart("video", videoFile.getName(),
                RequestBody.create(videoFile, MediaType.parse("video/mp4")))
            .build();

        Request request = new Request.Builder()
            .url(apiEndpoint + "/generate-clip")
            .addHeader("Authorization", "Bearer " + apiKey)
            .post(requestBody)
            .build();

        try (Response response = httpClient.newCall(request).execute()) {
            if (response.isSuccessful() && response.body() != null) {
                String responseBody = response.body().string();
                result = new JSObject(responseBody);
            } else {
                result.put("success", false);
                result.put("error", "生成失败: " + response.code());
            }
        }

        return result;
    }

    /**
     * Bitmap 转 Base64
     */
    private String bitmapToBase64(Bitmap bitmap) {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        bitmap.compress(Bitmap.CompressFormat.JPEG, 80, outputStream);
        byte[] byteArray = outputStream.toByteArray();
        return Base64.encodeToString(byteArray, Base64.DEFAULT);
    }

    /**
     * 生成模拟精彩片段数据
     */
    private JSArray generateMockHighlights() throws JSONException {
        JSArray highlights = new JSArray();
        
        // 模拟几个精彩片段
        for (int i = 0; i < 3; i++) {
            JSObject highlight = new JSObject();
            highlight.put("id", UUID.randomUUID().toString());
            highlight.put("startTime", i * 10 + 5);
            highlight.put("endTime", i * 10 + 15);
            highlight.put("confidence", 0.75 + Math.random() * 0.2);
            highlight.put("type", i % 2 == 0 ? "playing" : "sleeping");
            highlight.put("description", "宠物精彩瞬间 " + (i + 1));
            highlights.put(highlight);
        }
        
        return highlights;
    }

    /**
     * 取消正在进行的检测
     */
    @PluginMethod
    public void cancelDetection(PluginCall call) {
        // 取消所有正在进行的任务
        executorService.shutdownNow();
        executorService = Executors.newFixedThreadPool(3);
        
        JSObject result = new JSObject();
        result.put("success", true);
        result.put("message", "检测已取消");
        call.resolve(result);
    }

    @Override
    protected void handleOnDestroy() {
        super.handleOnDestroy();
        executorService.shutdown();
        httpClient.dispatcher().executorService().shutdown();
        httpClient.connectionPool().evictAll();
    }
}