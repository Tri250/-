package com.battery.master.data

/**
 * 应用内热更新 (v2.1.0-beta.2)：GitHub Releases 直查。
 * 仅携带版本元数据与 APK 直链，不含任何遥测/用户数据。
 */
data class AppUpdateInfo(
    val currentVersion: String,
    val latestVersion: String,
    val apkUrl: String?,
    val releaseNotes: String?,
    val isPrerelease: Boolean,
    val isNewer: Boolean
)

/** 热更新状态机：Idle → Checking → UpToDate/Available/Error → DownloadQueued */
sealed interface AppUpdateState {
    data object Idle : AppUpdateState
    data object Checking : AppUpdateState
    data object UpToDate : AppUpdateState
    data class Available(val info: AppUpdateInfo) : AppUpdateState
    data object DownloadQueued : AppUpdateState
    data class Error(val detail: String?) : AppUpdateState
}
