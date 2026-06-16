package com.pawsync.pro;

import android.content.Context;
import android.os.Build;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.FragmentActivity;

import java.security.KeyStore;
import java.util.concurrent.Executor;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;

/**
 * BiometricAuthHelper — 原生生物识别认证
 *
 * 支持指纹识别、面部识别（Android 6.0+）
 * 提供 CryptoObject 增强安全级别
 */
public class BiometricAuthHelper {
    private static final String TAG = "PawSyncBiometric";
    private static final String KEY_NAME = "pawsync_biometric_key";

    private final FragmentActivity activity;
    private final Executor executor;
    private BiometricAuthCallback callback;

    public interface BiometricAuthCallback {
        void onSuccess();
        void onError(int errorCode, String errorMessage);
        void onFailed();
    }

    public BiometricAuthHelper(FragmentActivity activity) {
        this.activity = activity;
        this.executor = ContextCompat.getMainExecutor(activity);
    }

    /**
     * 检查设备是否支持生物识别
     */
    public int canAuthenticate() {
        BiometricManager manager = BiometricManager.from(activity);
        return manager.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG);
    }

    /**
     * 检查是否可用
     */
    public boolean isAvailable() {
        return canAuthenticate() == BiometricManager.BIOMETRIC_SUCCESS;
    }

    /**
     * 获取可用性描述
     */
    public String getAvailabilityMessage() {
        switch (canAuthenticate()) {
            case BiometricManager.BIOMETRIC_SUCCESS:
                return "生物识别可用";
            case BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE:
                return "设备不支持生物识别";
            case BiometricManager.BIOMETRIC_ERROR_HW_UNAVAILABLE:
                return "生物识别硬件不可用";
            case BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED:
                return "未注册生物识别信息";
            case BiometricManager.BIOMETRIC_ERROR_SECURITY_UPDATE_REQUIRED:
                return "需要安全更新";
            default:
                return "生物识别不可用";
        }
    }

    /**
     * 显示生物识别认证对话框
     */
    public void authenticate(String title, String subtitle, BiometricAuthCallback callback) {
        this.callback = callback;

        BiometricPrompt.PromptInfo promptInfo = new BiometricPrompt.PromptInfo.Builder()
            .setTitle(title)
            .setSubtitle(subtitle)
            .setDescription("请验证您的身份以继续")
            .setNegativeButtonText("取消")
            .setConfirmationRequired(false)
            .setAllowedAuthenticators(
                BiometricManager.Authenticators.BIOMETRIC_STRONG
            )
            .build();

        BiometricPrompt prompt = new BiometricPrompt(activity, executor,
            new BiometricPrompt.AuthenticationCallback() {
                @Override
                public void onAuthenticationSucceeded(
                    @NonNull BiometricPrompt.AuthenticationResult result) {
                    super.onAuthenticationSucceeded(result);
                    Log.i(TAG, "Biometric authentication succeeded");
                    if (callback != null) {
                        callback.onSuccess();
                    }
                }

                @Override
                public void onAuthenticationError(int errorCode,
                    @NonNull CharSequence errString) {
                    super.onAuthenticationError(errorCode, errString);
                    Log.w(TAG, "Biometric auth error: " + errString);
                    if (callback != null) {
                        callback.onError(errorCode, errString.toString());
                    }
                }

                @Override
                public void onAuthenticationFailed() {
                    super.onAuthenticationFailed();
                    Log.w(TAG, "Biometric auth failed");
                    if (callback != null) {
                        callback.onFailed();
                    }
                }
            });

        try {
            prompt.authenticate(promptInfo);
        } catch (Exception e) {
            Log.e(TAG, "Failed to launch biometric prompt", e);
            if (callback != null) {
                callback.onError(BiometricPrompt.ERROR_HW_UNAVAILABLE, "无法启动生物识别");
            }
        }
    }

    /**
     * 带 CryptoObject 的安全认证（用于敏感操作如支付）
     */
    public void authenticateSecure(String title, String subtitle, BiometricAuthCallback callback) {
        try {
            Cipher cipher = getCipher();
            if (cipher == null) {
                authenticate(title, subtitle, callback);
                return;
            }

            this.callback = callback;

            BiometricPrompt.PromptInfo promptInfo = new BiometricPrompt.PromptInfo.Builder()
                .setTitle(title)
                .setSubtitle(subtitle)
                .setDescription("安全验证：请验证身份")
                .setNegativeButtonText("取消")
                .setConfirmationRequired(true)
                .setAllowedAuthenticators(
                    BiometricManager.Authenticators.BIOMETRIC_STRONG
                )
                .build();

            BiometricPrompt prompt = new BiometricPrompt(activity, executor,
                new BiometricPrompt.AuthenticationCallback() {
                    @Override
                    public void onAuthenticationSucceeded(
                        @NonNull BiometricPrompt.AuthenticationResult result) {
                        super.onAuthenticationSucceeded(result);
                        if (callback != null) callback.onSuccess();
                    }

                    @Override
                    public void onAuthenticationError(int errorCode,
                        @NonNull CharSequence errString) {
                        super.onAuthenticationError(errorCode, errString);
                        if (callback != null) callback.onError(errorCode, errString.toString());
                    }

                    @Override
                    public void onAuthenticationFailed() {
                        super.onAuthenticationFailed();
                        if (callback != null) callback.onFailed();
                    }
                });

            prompt.authenticate(promptInfo, new BiometricPrompt.CryptoObject(cipher));
        } catch (Exception e) {
            Log.e(TAG, "Secure biometric auth failed", e);
            authenticate(title, subtitle, callback);
        }
    }

    private Cipher getCipher() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                KeyStore keyStore = KeyStore.getInstance("AndroidKeyStore");
                keyStore.load(null);

                if (!keyStore.containsAlias(KEY_NAME)) {
                    KeyGenerator keyGenerator = KeyGenerator.getInstance(
                        KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore");
                    keyGenerator.init(new KeyGenParameterSpec.Builder(
                        KEY_NAME,
                        KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
                        .setBlockModes(KeyProperties.BLOCK_MODE_CBC)
                        .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_PKCS7)
                        .setUserAuthenticationRequired(true)
                        .build());
                    keyGenerator.generateKey();
                }

                SecretKey key = (SecretKey) keyStore.getKey(KEY_NAME, null);
                Cipher cipher = Cipher.getInstance(
                    KeyProperties.KEY_ALGORITHM_AES + "/"
                    + KeyProperties.BLOCK_MODE_CBC + "/"
                    + KeyProperties.ENCRYPTION_PADDING_PKCS7);
                cipher.init(Cipher.ENCRYPT_MODE, key);
                return cipher;
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to create cipher", e);
        }
        return null;
    }
}