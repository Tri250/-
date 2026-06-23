package com.pawsync.pro;

import android.app.Activity;
import android.os.Build;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.FragmentActivity;

import javax.crypto.Cipher;
import javax.crypto.CryptoObject;

public class BiometricHelper {

    private static final String TAG = "BiometricHelper";

    private final FragmentActivity activity;
    private BiometricPrompt biometricPrompt;
    private BiometricPrompt.PromptInfo promptInfo;
    private Callback callback;

    public interface Callback {
        void onSuccess(BiometricPrompt.CryptoObject cryptoObject);
        void onError(int errorCode, String errorMessage);
        void onFailed();
    }

    public BiometricHelper(FragmentActivity activity) {
        this.activity = activity;
    }

    /**
     * 检查设备是否支持生物识别
     * @return BiometricManager 常量：BIOMETRIC_SUCCESS, BIOMETRIC_STATUS_UNKNOWN,
     *         BIOMETRIC_ERROR_NO_HARDWARE, BIOMETRIC_ERROR_HW_UNAVAILABLE,
     *         BIOMETRIC_ERROR_NONE_ENROLLED, BIOMETRIC_ERROR_SECURITY_UPDATE_REQUIRED,
     *         BIOMETRIC_ERROR_UNSUPPORTED
     */
    public int canAuthenticate() {
        BiometricManager biometricManager = BiometricManager.from(activity);
        return biometricManager.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG
            | BiometricManager.Authenticators.BIOMETRIC_WEAK
            | BiometricManager.Authenticators.DEVICE_CREDENTIAL);
    }

    /**
     * 检查是否可以使用强生物识别（指纹/3D面部）
     */
    public boolean canAuthenticateWithStrongBiometrics() {
        BiometricManager biometricManager = BiometricManager.from(activity);
        return biometricManager.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG)
            == BiometricManager.BIOMETRIC_SUCCESS;
    }

    /**
     * 启动生物识别认证
     * @param title 对话框标题
     * @param subtitle 对话框副标题
     * @param description 对话框描述
     * @param negativeButtonText 取消按钮文字
     */
    public void authenticate(String title, String subtitle, String description,
                             String negativeButtonText) {
        authenticate(title, subtitle, description, negativeButtonText, null);
    }

    /**
     * 启动带加密支持的生物识别认证
     * @param title 对话框标题
     * @param subtitle 对话框副标题
     * @param description 对话框描述
     * @param negativeButtonText 取消按钮文字
     * @param cryptoObject 加密对象（可为 null）
     */
    public void authenticate(String title, String subtitle, String description,
                             String negativeButtonText,
                             BiometricPrompt.CryptoObject cryptoObject) {
        // 先检查是否支持生物识别
        int result = canAuthenticate();
        if (result != BiometricManager.BIOMETRIC_SUCCESS) {
            String errorMsg = getErrorMessage(result);
            if (callback != null) {
                callback.onError(result, errorMsg);
            }
            return;
        }

        // 创建 BiometricPrompt
        BiometricPrompt.AuthenticationCallback authCallback =
            new BiometricPrompt.AuthenticationCallback() {
            @Override
            public void onAuthenticationSucceeded(
                @NonNull BiometricPrompt.AuthenticationResult result) {
                super.onAuthenticationSucceeded(result);
                if (callback != null) {
                    callback.onSuccess(result.getCryptoObject());
                }
            }

            @Override
            public void onAuthenticationError(int errorCode, @NonNull CharSequence errString) {
                super.onAuthenticationError(errorCode, errString);
                if (callback != null) {
                    callback.onError(errorCode, errString.toString());
                }
            }

            @Override
            public void onAuthenticationFailed() {
                super.onAuthenticationFailed();
                if (callback != null) {
                    callback.onFailed();
                }
            }
        };

        biometricPrompt = new BiometricPrompt(activity,
            ContextCompat.getMainExecutor(activity), authCallback);

        // 构建 PromptInfo
        BiometricPrompt.PromptInfo.Builder builder = new BiometricPrompt.PromptInfo.Builder()
            .setTitle(title != null ? title : "生物识别验证")
            .setSubtitle(subtitle != null ? subtitle : "")
            .setDescription(description != null ? description : "")
            .setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_STRONG
                | BiometricManager.Authenticators.BIOMETRIC_WEAK);

        // 设置取消按钮（不允许 DEVICE_CREDENTIAL 时才显示）
        if (negativeButtonText != null && !negativeButtonText.isEmpty()) {
            builder.setNegativeButtonText(negativeButtonText);
        } else {
            builder.setNegativeButtonText("取消");
        }

        promptInfo = builder.build();

        // 启动认证
        if (cryptoObject != null) {
            biometricPrompt.authenticate(promptInfo, cryptoObject);
        } else {
            biometricPrompt.authenticate(promptInfo);
        }
    }

    /**
     * 使用 Cipher 创建 CryptoObject 进行加密认证
     * @param cipher 已初始化的 Cipher 对象
     */
    public void authenticateWithCipher(String title, String subtitle, String description,
                                       String negativeButtonText, Cipher cipher) {
        BiometricPrompt.CryptoObject cryptoObject = new BiometricPrompt.CryptoObject(cipher);
        authenticate(title, subtitle, description, negativeButtonText, cryptoObject);
    }

    /**
     * 取消正在进行的认证
     */
    public void cancelAuthentication() {
        if (biometricPrompt != null) {
            try {
                biometricPrompt.cancelAuthentication();
            } catch (Exception e) {
                Log.w(TAG, "Failed to cancel biometric authentication", e);
            }
        }
    }

    public void setCallback(Callback callback) {
        this.callback = callback;
    }

    /**
     * 将 BiometricManager 错误码转换为可读消息
     */
    private String getErrorMessage(int errorCode) {
        switch (errorCode) {
            case BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE:
                return "设备没有生物识别硬件";
            case BiometricManager.BIOMETRIC_ERROR_HW_UNAVAILABLE:
                return "生物识别硬件当前不可用";
            case BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED:
                return "未注册任何生物识别信息";
            case BiometricManager.BIOMETRIC_ERROR_SECURITY_UPDATE_REQUIRED:
                return "需要安全更新才能使用生物识别";
            case BiometricManager.BIOMETRIC_ERROR_UNSUPPORTED:
                return "不支持此生物识别方式";
            case BiometricManager.BIOMETRIC_STATUS_UNKNOWN:
                return "无法确定生物识别状态";
            default:
                return "未知错误 (" + errorCode + ")";
        }
    }

    /**
     * 将 BiometricPrompt 错误码转换为可读消息
     */
    public static String getPromptErrorMessage(int errorCode) {
        switch (errorCode) {
            case BiometricPrompt.ERROR_NEGATIVE_BUTTON:
                return "用户点击了取消按钮";
            case BiometricPrompt.ERROR_HW_UNAVAILABLE:
                return "硬件不可用";
            case BiometricPrompt.ERROR_UNABLE_TO_PROCESS:
                return "处理失败";
            case BiometricPrompt.ERROR_TIMEOUT:
                return "认证超时";
            case BiometricPrompt.ERROR_NO_SPACE:
                return "存储空间不足";
            case BiometricPrompt.ERROR_CANCELED:
                return "认证被取消";
            case BiometricPrompt.ERROR_LOCKOUT:
                return "尝试次数过多，已锁定";
            case BiometricPrompt.ERROR_VENDOR:
                return "厂商特定错误";
            case BiometricPrompt.ERROR_LOCKOUT_PERMANENT:
                return "尝试次数过多，永久锁定";
            case BiometricPrompt.ERROR_USER_CANCELED:
                return "用户取消了认证";
            case BiometricPrompt.ERROR_NO_BIOMETRICS:
                return "未注册生物识别信息";
            case BiometricPrompt.ERROR_HW_NOT_PRESENT:
                return "没有生物识别硬件";
            case BiometricPrompt.ERROR_SECURITY_UPDATE_REQUIRED:
                return "需要安全更新";
            default:
                return "未知错误 (" + errorCode + ")";
        }
    }
}
