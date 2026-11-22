package com.smalljelly.batterydata.shizuku

import android.os.IBinder
import android.util.Log
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

/**
 * Shizuku 特权服务实现（移植自 NexioSchedule）。
 *
 * 由 [ShizukuManager] 通过 `Shizuku.bindUserService` 拉起，运行在 Shizuku 的
 * shell/root 身份进程里——**不受 App 进程的 hiddenapi 限制**，因此能反射调用
 * `IConnectivityManager.setFirewallChainEnabled / setUidFirewallRule` 这两个 @hide 方法，
 * 临时放行/恢复 XMSF 的网络（超级岛渲染依赖它）。在 App 进程里直接反射会被 hiddenapi 拒绝。
 */
class PrivilegedServiceImpl : IPrivilegedService.Stub() {
    companion object {
        private const val TAG = "PrivilegedServiceImpl"
        private const val FIREWALL_CHAIN_OEM_DENY = 9
        private const val TIMEOUT_SECONDS = 3L
    }

    override fun setPackageNetworkingEnabled(uid: Int, enabled: Boolean): Boolean {
        return try {
            val serviceManagerClass = Class.forName("android.os.ServiceManager")
            val getServiceMethod = serviceManagerClass.getMethod("getService", String::class.java)
            val connectivityBinder = getServiceMethod.invoke(null, "connectivity") as? IBinder
                ?: throw IllegalStateException("Connectivity service not found")

            val iConnectivityManager = Class.forName("android.net.IConnectivityManager\$Stub")
                .getMethod("asInterface", IBinder::class.java)
                .invoke(null, connectivityBinder)

            val latch = CountDownLatch(1)
            var result = false
            val thread = Thread {
                try {
                    val setFirewallChainEnabled = iConnectivityManager.javaClass.getMethod(
                        "setFirewallChainEnabled",
                        Int::class.javaPrimitiveType,
                        Boolean::class.javaPrimitiveType,
                    )
                    setFirewallChainEnabled.invoke(iConnectivityManager, FIREWALL_CHAIN_OEM_DENY, true)

                    // OEM_DENY 是 deny 型链：放行必须用 FIREWALL_RULE_ALLOW(1) 白名单该 uid，
                    // 0(DEFAULT) 在链启用时仍随链默认被拒，等于没放行；2 = FIREWALL_RULE_DENY
                    val rule = if (enabled) 1 else 2
                    val setUidFirewallRule = iConnectivityManager.javaClass.getMethod(
                        "setUidFirewallRule",
                        Int::class.javaPrimitiveType,
                        Int::class.javaPrimitiveType,
                        Int::class.javaPrimitiveType,
                    )
                    setUidFirewallRule.invoke(iConnectivityManager, FIREWALL_CHAIN_OEM_DENY, uid, rule)
                    result = true
                    Log.d(TAG, "set networking uid=$uid enabled=$enabled ok")
                } catch (e: Exception) {
                    Log.e(TAG, "Failed in worker thread", e)
                    result = false
                } finally {
                    latch.countDown()
                }
            }
            thread.start()
            val completed = latch.await(TIMEOUT_SECONDS, TimeUnit.SECONDS)
            if (!completed) {
                thread.interrupt()
                Log.w(TAG, "Operation timed out")
                false
            } else {
                result
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to set package networking", e)
            false
        }
    }
}