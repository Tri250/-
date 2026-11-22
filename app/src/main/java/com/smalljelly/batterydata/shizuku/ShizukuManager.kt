package com.smalljelly.batterydata.shizuku

import android.content.ComponentName
import android.content.Context
import android.content.ServiceConnection
import android.content.pm.PackageManager
import android.os.IBinder
import android.util.Log
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import rikka.shizuku.Shizuku

/**
 * Shizuku 管理器（移植自 NexioSchedule）。
 *
 * 小米超级岛通知走 XMSF（com.xiaomi.xmsf）通道，系统默认用 OEM 防火墙链(chain 9)掐其网络，
 * 岛就渲染不出来。这里借 Shizuku 临时放行/恢复 XMSF 网络：发岛前放行 → notify → 恢复默认掐网。
 *
 * ⚠ 关键：`setFirewallChainEnabled / setUidFirewallRule` 是 @hide 受限 API，在 App 进程反射
 * 会被 hiddenapi 拒绝（NoSuchMethodException）。必须放进 [PrivilegedServiceImpl]——由
 * `Shizuku.bindUserService` 拉起、运行在 shell/root 身份进程，不受 hiddenapi 限制。
 */
object ShizukuManager {
    private const val TAG = "ShizukuManager"
    private const val XMSF_PACKAGE = "com.xiaomi.xmsf"

    private var privilegedService: IPrivilegedService? = null
    private var serviceConnected = false
    private var bindLatch = CountDownLatch(1)

    private val serviceConnection = object : ServiceConnection {
        override fun onServiceConnected(name: ComponentName?, binder: IBinder?) {
            if (binder != null && binder.pingBinder()) {
                privilegedService = IPrivilegedService.Stub.asInterface(binder)
                serviceConnected = true
                bindLatch.countDown()
                Log.d(TAG, "Privileged service connected")
            }
        }

        override fun onServiceDisconnected(name: ComponentName?) {
            privilegedService = null
            serviceConnected = false
            bindLatch = CountDownLatch(1)
            Log.d(TAG, "Privileged service disconnected")
        }
    }

    fun init(context: Context) {
        try {
            runCatching { rikka.sui.Sui.init(context.packageName) }
            Log.d(TAG, "Shizuku initialized, running=${isShizukuRunning()}")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to initialize Shizuku", e)
        }
    }

    fun isShizukuRunning(): Boolean = try {
        Shizuku.pingBinder()
    } catch (e: Exception) {
        false
    }

    fun checkSelfPermission(): Boolean = try {
        Shizuku.checkSelfPermission() == PackageManager.PERMISSION_GRANTED
    } catch (e: Exception) {
        false
    }

    fun requestPermission(callback: (Boolean) -> Unit) {
        if (!isShizukuRunning()) {
            callback(false)
            return
        }
        if (checkSelfPermission()) {
            callback(true)
            return
        }
        val listener = object : Shizuku.OnRequestPermissionResultListener {
            override fun onRequestPermissionResult(requestCode: Int, grantResult: Int) {
                Shizuku.removeRequestPermissionResultListener(this)
                callback(grantResult == PackageManager.PERMISSION_GRANTED)
            }
        }
        Shizuku.addRequestPermissionResultListener(listener)
        try {
            Shizuku.requestPermission(1001)
        } catch (e: Exception) {
            Shizuku.removeRequestPermissionResultListener(listener)
            callback(false)
        }
    }

    /** 临时放行/恢复 XMSF 网络（超级岛 bypass）。无权限或服务不可用时返回 false。 */
    fun setXmsfNetworkingEnabled(context: Context, enabled: Boolean): Boolean {
        if (!isShizukuRunning() || !checkSelfPermission()) {
            Log.w(TAG, "Shizuku not available or no permission")
            return false
        }
        return try {
            val xmsfUid = context.packageManager.getPackageUid(XMSF_PACKAGE, 0)
            val service = getPrivilegedService(context) ?: return false
            service.setPackageNetworkingEnabled(xmsfUid, enabled)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to set XMSF networking", e)
            false
        }
    }

    private fun getPrivilegedService(context: Context): IPrivilegedService? {
        if (privilegedService != null && serviceConnected) return privilegedService
        return try {
            bindLatch = CountDownLatch(1)
            val args = Shizuku.UserServiceArgs(
                ComponentName(context.packageName, PrivilegedServiceImpl::class.java.name),
            )
                .daemon(false)
                .processNameSuffix("privileged")
                .debuggable(false)
                .version(1)
            Shizuku.bindUserService(args, serviceConnection)
            val connected = bindLatch.await(3, TimeUnit.SECONDS)
            if (!connected) Log.w(TAG, "Privileged service bind timed out")
            privilegedService
        } catch (e: Exception) {
            Log.e(TAG, "Failed to bind privileged service", e)
            null
        }
    }
}