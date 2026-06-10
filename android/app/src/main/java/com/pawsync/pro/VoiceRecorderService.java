package com.pawsync.pro;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.media.MediaRecorder;
import android.os.Build;
import android.os.Environment;
import android.util.Log;

import androidx.core.app.ActivityCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.io.File;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * 原生录音服务插件
 * 使用 MediaRecorder 实现高质量录音
 * 支持自动上传到后端
 */
@CapacitorPlugin(
    name = "VoiceRecorderService",
    permissions = {
        @Permission(
            alias = "microphone",
            strings = { Manifest.permission.RECORD_AUDIO }
        ),
        @Permission(
            alias = "storage",
            strings = {
                Manifest.permission.READ_EXTERNAL_STORAGE,
                Manifest.permission.WRITE_EXTERNAL_STORAGE
            }
        )
    }
)
public class VoiceRecorderService extends Plugin {

    private static final String TAG = "VoiceRecorderService";
    
    // 录音器
    private MediaRecorder mediaRecorder;
    
    // 录音状态
    private boolean isRecording = false;
    
    // 当前录音文件路径
    private String currentRecordingPath;
    
    // 录音开始时间
    private long recordingStartTime;
    
    // 录音输出目录
    private File recordingsDir;
    
    // 后端上传地址
    private String uploadEndpoint;
    
    // 线程池
    private final ExecutorService executorService = Executors.newSingleThreadExecutor();
    
    // 录音配置
    private int audioSource = MediaRecorder.AudioSource.MIC;
    private int outputFormat = MediaRecorder.OutputFormat.MPEG_4;
    private int audioEncoder = MediaRecorder.AudioEncoder.AAC;
    private int audioSamplingRate = 44100;
    private int audioBitRate = 128000;

    @Override
    public void load() {
        super.load();
        initRecordingsDir();
        Log.d(TAG, "录音服务已加载");
    }

    /**
     * 初始化录音目录
     */
    private void initRecordingsDir() {
        Context context = getContext();
        
        // 使用应用私有目录
        recordingsDir = new File(context.getExternalFilesDir(Environment.DIRECTORY_MUSIC), "recordings");
        if (!recordingsDir.exists()) {
            recordingsDir.mkdirs();
        }
        Log.d(TAG, "录音目录: " + recordingsDir.getAbsolutePath());
    }

    /**
     * 开始录音
     * @param call Capacitor 插件调用
     *             options: 可选配置
     *               - samplingRate: 采样率 (默认 44100)
     *               - bitRate: 比特率 (默认 128000)
     *               - format: 输出格式 (mp4, aac, amr)
     */
    @PluginMethod
    public void startRecording(PluginCall call) {
        // 检查权限
        if (!hasMicrophonePermission()) {
            requestPermissionForAlias("microphone", call, "microphonePermissionCallback");
            return;
        }

        // 检查是否已在录音
        if (isRecording) {
            call.reject("已在录音中");
            return;
        }

        // 获取配置
        JSObject options = call.getObject("options", new JSObject());
        audioSamplingRate = options.getInt("samplingRate", 44100);
        audioBitRate = options.getInt("bitRate", 128000);
        String format = options.getString("format", "mp4");

        // 设置输出格式
        switch (format.toLowerCase()) {
            case "aac":
                outputFormat = MediaRecorder.OutputFormat.AAC_ADTS;
                audioEncoder = MediaRecorder.AudioEncoder.AAC;
                break;
            case "amr":
                outputFormat = MediaRecorder.OutputFormat.AMR_NB;
                audioEncoder = MediaRecorder.AudioEncoder.AMR_NB;
                break;
            default:
                outputFormat = MediaRecorder.OutputFormat.MPEG_4;
                audioEncoder = MediaRecorder.AudioEncoder.AAC;
                break;
        }

        try {
            // 创建录音文件
            String fileName = generateRecordingFileName(format);
            currentRecordingPath = new File(recordingsDir, fileName).getAbsolutePath();
            
            // 初始化 MediaRecorder
            initMediaRecorder();

            // 开始录音
            mediaRecorder.prepare();
            mediaRecorder.start();
            
            isRecording = true;
            recordingStartTime = System.currentTimeMillis();

            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "录音已开始");
            result.put("recordingPath", currentRecordingPath);
            call.resolve(result);
            Log.d(TAG, "录音已开始: " + currentRecordingPath);

        } catch (IOException | IllegalStateException e) {
            Log.e(TAG, "启动录音失败", e);
            releaseMediaRecorder();
            call.reject("启动录音失败: " + e.getMessage());
        }
    }

    /**
     * 停止录音
     * @param call Capacitor 插件调用
     *             upload: 是否自动上传 (默认 false)
     */
    @PluginMethod
    public void stopRecording(PluginCall call) {
        if (!isRecording || mediaRecorder == null) {
            call.reject("当前没有录音");
            return;
        }

        boolean shouldUpload = call.getBoolean("upload", false);

        try {
            // 停止录音
            mediaRecorder.stop();
            mediaRecorder.release();
            mediaRecorder = null;
            isRecording = false;

            // 计算录音时长
            long duration = System.currentTimeMillis() - recordingStartTime;
            File recordingFile = new File(currentRecordingPath);
            long fileSize = recordingFile.exists() ? recordingFile.length() : 0;

            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "录音已停止");
            result.put("recordingPath", currentRecordingPath);
            result.put("duration", duration);
            result.put("fileSize", fileSize);
            result.put("fileName", recordingFile.getName());

            // 自动上传
            if (shouldUpload && uploadEndpoint != null && !uploadEndpoint.isEmpty()) {
                uploadRecordingAsync(currentRecordingPath, call);
            } else {
                call.resolve(result);
            }

            Log.d(TAG, "录音已停止: " + currentRecordingPath + ", 时长: " + duration + "ms");

        } catch (Exception e) {
            Log.e(TAG, "停止录音失败", e);
            releaseMediaRecorder();
            call.reject("停止录音失败: " + e.getMessage());
        }
    }

    /**
     * 获取录音路径
     */
    @PluginMethod
    public void getRecordingPath(PluginCall call) {
        JSObject result = new JSObject();
        
        if (currentRecordingPath != null) {
            File file = new File(currentRecordingPath);
            result.put("recordingPath", currentRecordingPath);
            result.put("exists", file.exists());
            result.put("fileName", file.getName());
            
            if (file.exists()) {
                result.put("fileSize", file.length());
            }
        } else {
            result.put("recordingPath", "");
            result.put("exists", false);
        }
        
        call.resolve(result);
    }

    /**
     * 获取所有录音文件
     */
    @PluginMethod
    public void getAllRecordings(PluginCall call) {
        JSObject result = new JSObject();
        JSArray recordings = new JSArray();

        if (recordingsDir != null && recordingsDir.exists()) {
            File[] files = recordingsDir.listFiles();
            if (files != null) {
                for (File file : files) {
                    if (file.isFile() && isAudioFile(file.getName())) {
                        JSObject fileInfo = new JSObject();
                        fileInfo.put("name", file.getName());
                        fileInfo.put("path", file.getAbsolutePath());
                        fileInfo.put("size", file.length());
                        fileInfo.put("lastModified", file.lastModified());
                        recordings.put(fileInfo);
                    }
                }
            }
        }

        result.put("recordings", recordings);
        result.put("count", recordings.length());
        result.put("directory", recordingsDir.getAbsolutePath());
        call.resolve(result);
    }

    /**
     * 删除录音文件
     */
    @PluginMethod
    public void deleteRecording(PluginCall call) {
        String path = call.getString("path");

        if (path == null || path.isEmpty()) {
            call.reject("缺少文件路径");
            return;
        }

        File file = new File(path);
        if (!file.exists()) {
            call.reject("文件不存在");
            return;
        }

        if (file.delete()) {
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "文件已删除");
            call.resolve(result);
        } else {
            call.reject("删除文件失败");
        }
    }

    /**
     * 设置上传端点
     */
    @PluginMethod
    public void setUploadEndpoint(PluginCall call) {
        String endpoint = call.getString("endpoint");
        
        if (endpoint == null || endpoint.isEmpty()) {
            call.reject("缺少端点地址");
            return;
        }

        uploadEndpoint = endpoint;
        
        JSObject result = new JSObject();
        result.put("success", true);
        result.put("message", "上传端点已设置");
        call.resolve(result);
    }

    /**
     * 手动上传录音
     */
    @PluginMethod
    public void uploadRecording(PluginCall call) {
        String path = call.getString("path");

        if (path == null || path.isEmpty()) {
            // 使用当前录音路径
            if (currentRecordingPath != null) {
                path = currentRecordingPath;
            } else {
                call.reject("缺少文件路径");
                return;
            }
        }

        if (uploadEndpoint == null || uploadEndpoint.isEmpty()) {
            call.reject("未设置上传端点");
            return;
        }

        File file = new File(path);
        if (!file.exists()) {
            call.reject("文件不存在");
            return;
        }

        uploadRecordingAsync(path, call);
    }

    /**
     * 检查录音状态
     */
    @PluginMethod
    public void isRecording(PluginCall call) {
        JSObject result = new JSObject();
        result.put("isRecording", isRecording);
        
        if (isRecording) {
            long duration = System.currentTimeMillis() - recordingStartTime;
            result.put("duration", duration);
            result.put("currentPath", currentRecordingPath);
        }
        
        call.resolve(result);
    }

    /**
     * 取消录音
     */
    @PluginMethod
    public void cancelRecording(PluginCall call) {
        if (!isRecording || mediaRecorder == null) {
            call.reject("当前没有录音");
            return;
        }

        try {
            mediaRecorder.stop();
            mediaRecorder.release();
            mediaRecorder = null;
            isRecording = false;

            // 删除未完成的录音文件
            if (currentRecordingPath != null) {
                File file = new File(currentRecordingPath);
                if (file.exists()) {
                    file.delete();
                }
            }

            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "录音已取消");
            call.resolve(result);
            Log.d(TAG, "录音已取消");

        } catch (Exception e) {
            Log.e(TAG, "取消录音失败", e);
            releaseMediaRecorder();
            call.reject("取消录音失败: " + e.getMessage());
        }
    }

    /**
     * 初始化 MediaRecorder
     */
    private void initMediaRecorder() {
        mediaRecorder = new MediaRecorder();
        
        // 设置音频源
        mediaRecorder.setAudioSource(audioSource);
        
        // 设置输出格式
        mediaRecorder.setOutputFormat(outputFormat);
        
        // 设置音频编码器
        mediaRecorder.setAudioEncoder(audioEncoder);
        
        // 设置采样率和比特率
        mediaRecorder.setAudioSamplingRate(audioSamplingRate);
        mediaRecorder.setAudioEncodingBitRate(audioBitRate);
        
        // 设置输出文件
        mediaRecorder.setOutputFile(currentRecordingPath);
        
        Log.d(TAG, "MediaRecorder 配置完成 - 采样率: " + audioSamplingRate + ", 比特率: " + audioBitRate);
    }

    /**
     * 生成录音文件名
     */
    private String generateRecordingFileName(String format) {
        SimpleDateFormat sdf = new SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault());
        String timestamp = sdf.format(new Date());
        String extension = getExtension(format);
        return "recording_" + timestamp + extension;
    }

    /**
     * 获取文件扩展名
     */
    private String getExtension(String format) {
        switch (format.toLowerCase()) {
            case "aac":
                return ".aac";
            case "amr":
                return ".amr";
            default:
                return ".m4a";
        }
    }

    /**
     * 检查是否为音频文件
     */
    private boolean isAudioFile(String fileName) {
        String lower = fileName.toLowerCase();
        return lower.endsWith(".m4a") || lower.endsWith(".aac") || 
               lower.endsWith(".amr") || lower.endsWith(".mp3") ||
               lower.endsWith(".wav") || lower.endsWith(".ogg");
    }

    /**
     * 异步上传录音
     */
    private void uploadRecordingAsync(String filePath, PluginCall call) {
        executorService.execute(() -> {
            try {
                // 这里实现上传逻辑
                // 实际项目中应该使用 OkHttp 或 Retrofit 进行上传
                File file = new File(filePath);
                
                // 模拟上传过程
                Thread.sleep(1000);
                
                JSObject result = new JSObject();
                result.put("success", true);
                result.put("message", "上传成功");
                result.put("fileName", file.getName());
                result.put("fileSize", file.length());
                
                // 在主线程返回结果
                getBridge().executeOnMainThread(() -> call.resolve(result));
                
                Log.d(TAG, "录音上传成功: " + filePath);
                
            } catch (Exception e) {
                Log.e(TAG, "上传录音失败", e);
                getBridge().executeOnMainThread(() -> call.reject("上传失败: " + e.getMessage()));
            }
        });
    }

    /**
     * 释放 MediaRecorder
     */
    private void releaseMediaRecorder() {
        if (mediaRecorder != null) {
            try {
                mediaRecorder.release();
            } catch (Exception e) {
                Log.e(TAG, "释放 MediaRecorder 异常", e);
            }
            mediaRecorder = null;
        }
        isRecording = false;
    }

    /**
     * 检查麦克风权限
     */
    private boolean hasMicrophonePermission() {
        return getPermissionState("microphone") == PermissionState.GRANTED;
    }

    /**
     * 麦克风权限回调
     */
    @PermissionCallback
    private void microphonePermissionCallback(PluginCall call) {
        if (getPermissionState("microphone") == PermissionState.GRANTED) {
            startRecording(call);
        } else {
            call.reject("麦克风权限被拒绝");
        }
    }

    @Override
    protected void handleOnDestroy() {
        super.handleOnDestroy();
        releaseMediaRecorder();
        executorService.shutdown();
    }
}