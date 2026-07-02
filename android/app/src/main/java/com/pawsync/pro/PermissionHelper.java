package com.pawsync.pro;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

public class PermissionHelper {

    private static final String TAG = "PermissionHelper";
    private static final String PREFS_NAME = "pawsync_permission_prefs";
    private static final String KEY_REQUESTED_PREFIX = "permission_requested_";

    // 权限状态常量
    public static final int PERMISSION_GRANTED = 0;
    public static final int PERMISSION_DENIED = 1;
    public static final int PERMISSION_DENIED_DO_NOT_ASK_AGAIN = 2;

    private final Activity activity;
    private final Context context;
    private final SharedPreferences permissionPrefs;

    public PermissionHelper(Activity activity) {
        this.activity = activity;
        this.context = activity.getApplicationContext();
        this.permissionPrefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }

    // ==================== 权限检查 ====================

    /**
     * 检查单个权限状态
     * @param permission 权限字符串
     * @return PERMISSION_GRANTED, PERMISSION_DENIED, or PERMISSION_DENIED_DO_NOT_ASK_AGAIN
     */
    public int checkPermission(String permission) {
        if (permission == null || permission.isEmpty()) {
            return PERMISSION_DENIED;
        }

        if (ContextCompat.checkSelfPermission(context, permission)
            == PackageManager.PERMISSION_GRANTED) {
            return PERMISSION_GRANTED;
        }

        // 仅当曾经请求过且不再显示 rationale 时，才判定为永久拒绝
        boolean hasRequestedBefore = permissionPrefs.getBoolean(KEY_REQUESTED_PREFIX + permission, false);
        if (hasRequestedBefore && !shouldShowRequestPermissionRationale(permission)) {
            return PERMISSION_DENIED_DO_NOT_ASK_AGAIN;
        }

        return PERMISSION_DENIED;
    }

    /**
     * 检查权限是否已授予
     */
    public boolean isPermissionGranted(String permission) {
        return ContextCompat.checkSelfPermission(context, permission)
            == PackageManager.PERMISSION_GRANTED;
    }

    /**
     * 检查多个权限是否全部已授予
     */
    public boolean areAllPermissionsGranted(String[] permissions) {
        for (String permission : permissions) {
            if (!isPermissionGranted(permission)) {
                return false;
            }
        }
        return true;
    }

    // ==================== 权限请求 ====================

    /**
     * 请求单个权限
     * @param permission 权限字符串
     * @param requestCode 请求码
     */
    public void requestPermission(String permission, int requestCode) {
        if (permission == null || permission.isEmpty()) {
            return;
        }
        markPermissionRequested(permission);
        ActivityCompat.requestPermissions(activity, new String[]{permission}, requestCode);
    }

    /**
     * 批量请求权限
     * @param permissions 权限数组
     * @param requestCode 请求码
     */
    public void requestPermissions(String[] permissions, int requestCode) {
        if (permissions == null || permissions.length == 0) {
            return;
        }
        for (String permission : permissions) {
            markPermissionRequested(permission);
        }
        ActivityCompat.requestPermissions(activity, permissions, requestCode);
    }

    /**
     * 标记权限已发起过请求，用于准确判断永久拒绝状态
     */
    private void markPermissionRequested(String permission) {
        if (permission == null || permission.isEmpty()) {
            return;
        }
        permissionPrefs.edit()
            .putBoolean(KEY_REQUESTED_PREFIX + permission, true)
            .apply();
    }

    /**
     * 是否应该展示权限说明
     * @param permission 权限字符串
     * @return 如果用户之前拒绝过且未选择"不再询问"，返回 true
     */
    public boolean shouldShowRequestPermissionRationale(String permission) {
        return ActivityCompat.shouldShowRequestPermissionRationale(activity, permission);
    }

    // ==================== Android 13+ 媒体权限适配 ====================

    /**
     * 获取适配当前 Android 版本的图片读取权限
     * Android 13+: READ_MEDIA_IMAGES
     * Android 14+ 部分媒体: READ_MEDIA_VISUAL_USER_SELECTED（作为 READ_MEDIA_IMAGES 的补充）
     * Android 12 及以下: READ_EXTERNAL_STORAGE
     */
    public String getReadImagesPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            // Android 13+
            return android.Manifest.permission.READ_MEDIA_IMAGES;
        } else {
            return android.Manifest.permission.READ_EXTERNAL_STORAGE;
        }
    }

    /**
     * 获取适配当前 Android 版本的视频读取权限
     */
    public String getReadVideoPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            return android.Manifest.permission.READ_MEDIA_VIDEO;
        } else {
            return android.Manifest.permission.READ_EXTERNAL_STORAGE;
        }
    }

    /**
     * 获取适配当前 Android 版本的音频读取权限
     */
    public String getReadAudioPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            return android.Manifest.permission.READ_MEDIA_AUDIO;
        } else {
            return android.Manifest.permission.READ_EXTERNAL_STORAGE;
        }
    }

    /**
     * 获取完整的媒体权限列表（根据 Android 版本适配）
     * Android 14+: 包含 READ_MEDIA_VISUAL_USER_SELECTED
     * Android 13: READ_MEDIA_IMAGES, READ_MEDIA_VIDEO, READ_MEDIA_AUDIO
     * Android 12-: READ_EXTERNAL_STORAGE
     */
    public String[] getMediaPermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            return new String[]{
                android.Manifest.permission.READ_MEDIA_IMAGES,
                android.Manifest.permission.READ_MEDIA_VIDEO,
                android.Manifest.permission.READ_MEDIA_AUDIO,
                android.Manifest.permission.READ_MEDIA_VISUAL_USER_SELECTED
            };
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            return new String[]{
                android.Manifest.permission.READ_MEDIA_IMAGES,
                android.Manifest.permission.READ_MEDIA_VIDEO,
                android.Manifest.permission.READ_MEDIA_AUDIO
            };
        } else {
            return new String[]{
                android.Manifest.permission.READ_EXTERNAL_STORAGE
            };
        }
    }

    /**
     * 请求媒体权限（自动适配 Android 版本）
     * @param requestCode 请求码
     */
    public void requestMediaPermissions(int requestCode) {
        requestPermissions(getMediaPermissions(), requestCode);
    }

    // ==================== Android 14+ 部分媒体权限 ====================

    /**
     * 检查是否拥有部分媒体访问权限（Android 14+）
     * 用户可以选择只授予部分照片/视频的访问权限
     */
    public boolean hasPartialMediaAccess() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            // 如果有 READ_MEDIA_VISUAL_USER_SELECTED 但没有 READ_MEDIA_IMAGES
            // 说明用户选择了部分访问
            boolean hasPartial = isPermissionGranted(
                android.Manifest.permission.READ_MEDIA_VISUAL_USER_SELECTED);
            boolean hasFull = isPermissionGranted(
                android.Manifest.permission.READ_MEDIA_IMAGES);
            return hasPartial && !hasFull;
        }
        return false;
    }

    /**
     * 请求完整的媒体访问权限（从部分访问升级到完全访问）
     * Android 14+ 需要再次请求 READ_MEDIA_IMAGES
     */
    public void requestFullMediaAccess(int requestCode) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            requestPermission(android.Manifest.permission.READ_MEDIA_IMAGES, requestCode);
        }
    }

    // ==================== Android 16 权限自动重置检测 ====================

    /**
     * 检测权限是否可能被系统自动重置
     * Android 16 引入了更严格的权限自动重置策略
     * @return 如果应用长时间未使用，权限可能已被重置
     */
    public boolean mayHaveAutoResetPermissions() {
        if (Build.VERSION.SDK_INT >= 30) {
            // Android 11+ 引入了权限自动重置
            // Android 16 加强了此策略
            try {
                // 检查关键权限是否仍然持有
                String[] criticalPermissions = getMediaPermissions();
                for (String permission : criticalPermissions) {
                    if (ContextCompat.checkSelfPermission(context, permission)
                        == PackageManager.PERMISSION_GRANTED) {
                        // 至少还有一个权限，可能没有被重置
                        return false;
                    }
                }
                // 没有任何媒体权限，可能是被重置了
                return true;
            } catch (Exception e) {
                Log.w(TAG, "Failed to check auto-reset status", e);
            }
        }
        return false;
    }

    // ==================== 打开应用设置 ====================

    /**
     * 打开应用设置页面
     * 当权限被永久拒绝时，引导用户手动开启权限
     */
    public void openAppSettings() {
        Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
        Uri uri = Uri.fromParts("package", context.getPackageName(), null);
        intent.setData(uri);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        context.startActivity(intent);
    }

    /**
     * 打开系统权限管理页面（Android 16+ 专用）
     */
    public void openPermissionSettings(String permission) {
        if (Build.VERSION.SDK_INT >= 30) {
            try {
                Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                Uri uri = Uri.fromParts("package", context.getPackageName(), null);
                intent.setData(uri);
                intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(intent);
            } catch (Exception e) {
                Log.w(TAG, "Failed to open permission settings", e);
                openAppSettings();
            }
        } else {
            openAppSettings();
        }
    }

    // ==================== 权限结果解析 ====================

    /**
     * 解析权限请求结果
     * @param permissions 请求的权限数组
     * @param grantResults 授权结果数组
     * @return 所有权限是否都已授予
     */
    public boolean parsePermissionResults(String[] permissions, int[] grantResults) {
        if (permissions == null || grantResults == null) {
            return false;
        }

        for (int result : grantResults) {
            if (result != PackageManager.PERMISSION_GRANTED) {
                return false;
            }
        }
        return true;
    }

    /**
     * 检查权限请求结果中是否有被永久拒绝的权限
     * @param permissions 请求的权限数组
     * @param grantResults 授权结果数组
     * @return 是否有权限被永久拒绝（用户选择了"不再询问"）
     */
    public boolean hasPermanentlyDeniedPermission(String[] permissions, int[] grantResults) {
        if (permissions == null || grantResults == null) {
            return false;
        }

        for (int i = 0; i < permissions.length && i < grantResults.length; i++) {
            if (grantResults[i] != PackageManager.PERMISSION_GRANTED) {
                if (!shouldShowRequestPermissionRationale(permissions[i])) {
                    return true;
                }
            }
        }
        return false;
    }
}
