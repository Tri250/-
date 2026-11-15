package com.battery.master

import android.app.Application

/**
 * v2.0.0-beta.1 P2 GA 修复：Application 入口——安装轻量崩溃捕获。
 *
 * 崩溃堆栈仅写应用私有目录 (filesDir/crash/)，不做任何网络上传 (项目信条
 * 零权限/零上传)；用户可在总览页"关于"卡一键导出分享。安装失败静默保持
 * 默认处理器，不影响任何功能。
 */
class BatteryMasterApplication : Application() {

    override fun onCreate() {
        super.onCreate()
        try {
            CrashLogHandler.install(
                this,
                versionName = BuildConfig.VERSION_NAME,
                versionCode = BuildConfig.VERSION_CODE
            )
        } catch (e: Throwable) {
            // 崩溃捕获安装失败不阻塞启动
        }
    }
}
