package com.battery.master

import android.app.Application
import androidx.test.core.app.ApplicationProvider
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/**
 * v2.2.0 三维度全量自检第二轮：本地崩溃捕获落盘语义审计断言。
 *
 * 覆盖 (CrashLogHandler 数据库维度——崩溃日志 filesDir/crash/ 落盘组件)：
 * - 空目录/无崩溃：crashFiles 空列表、crashCount=0、导出返回 null (诚实不输出空文件)；
 * - 前缀过滤与时间升序：crash-*.txt 参与列表，噪声文件不混入，字典序=时间序。
 *
 * 滑窗修剪 (CRASH_KEEP_MAX=10) 与全链路 Throwable 兜底依赖真实崩溃链触发，
 * 触发路径会走进程默认退出语义 (测试 JVM 不可模拟)，由代码路径审查覆盖。
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
class CrashLogHandlerTest {

    private val app: Application get() = ApplicationProvider.getApplicationContext()

    @Test
    fun crashFiles_emptyDir_returnsEmptyAndExportNull() {
        assertTrue("无崩溃目录应返回空列表", CrashLogHandler.crashFiles(app).isEmpty())
        assertEquals(0, CrashLogHandler.crashCount(app))
        assertNull("无崩溃时导出必须返回 null (不虚构空分享)", CrashLogHandler.buildShareIntent(app))
    }

    @Test
    fun crashFiles_prefixFilteredAndSortedAscending() {
        val dir = java.io.File(app.filesDir, "crash").also { it.mkdirs() }
        try {
            java.io.File(dir, "crash-20260101_120000.txt").writeText("newer crash")
            java.io.File(dir, "crash-20260101_110000.txt").writeText("older crash")
            java.io.File(dir, "noise.txt").writeText("not a crash file")

            val files = CrashLogHandler.crashFiles(app)
            assertEquals("非 crash- 前缀文件不得混入崩溃列表", 2, files.size)
            assertTrue("崩溃列表必须时间升序 (字典序=文件名时间戳序)", files[0].name < files[1].name)
            assertEquals("crashCount 与列表长度一致", 2, CrashLogHandler.crashCount(app))
        } finally {
            dir.listFiles()?.forEach { it.delete() }
            dir.delete()
        }
    }
}
