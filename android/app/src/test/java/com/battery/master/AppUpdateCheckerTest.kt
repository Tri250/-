package com.battery.master

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import com.battery.master.service.AppUpdateChecker
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

/**
 * v2.1.0-beta.2 应用内热更新检查器单测：
 * - compareVersions 语义化版本比较边界 (beta 链升位 / beta < GA / v 前缀 / 畸形输入)
 * - parseReleaseJson GitHub Releases fixture 解析与畸形输入兜底
 * - checkForUpdate fetcher 注入 fake → 不触真实网络；结果落盘 update_last_* 键
 */
@RunWith(RobolectricTestRunner::class)
class AppUpdateCheckerTest {

    private lateinit var checker: AppUpdateChecker

    /** GitHub Releases /latest 响应 fixture (与发布产物命名规范一致) */
    private val releaseFixture = """
        {
          "tag_name": "v2.1.0-beta.2",
          "name": "v2.1.0-beta.2",
          "prerelease": true,
          "body": "## 安装说明\n- 下载 APK 安装",
          "assets": [
            {"name": "web-demo-dist.zip", "browser_download_url": "https://github.com/Tri250/-/releases/download/v2.1.0-beta.2/web-demo-dist.zip"},
            {"name": "Android-Battery-Master-v2.1.0-beta.2-release.apk", "browser_download_url": "https://github.com/Tri250/-/releases/download/v2.1.0-beta.2/Android-Battery-Master-v2.1.0-beta.2-release.apk"},
            {"name": "SHA256SUMS.txt", "browser_download_url": "https://github.com/Tri250/-/releases/download/v2.1.0-beta.2/SHA256SUMS.txt"}
          ]
        }
    """.trimIndent()

    @Before
    fun setUp() {
        checker = AppUpdateChecker(ApplicationProvider.getApplicationContext<Context>())
    }

    // ---------- compareVersions：语义化版本比较 ----------

    @Test
    fun betaPatchBumpIsNewer() {
        assertTrue(checker.compareVersions("2.1.0-beta.1", "2.1.0-beta.2") < 0)
        assertTrue(checker.compareVersions("2.1.0-beta.2", "2.1.0-beta.1") > 0)
        assertTrue(checker.compareVersions("2.1.0-beta.2", "2.1.0-beta.2") == 0)
    }

    @Test
    fun minorBumpBeatsAnyPreRelease() {
        assertTrue(checker.compareVersions("2.1.0-beta.2", "2.2.0-beta.1") < 0)
        assertTrue(checker.compareVersions("2.1.0-beta.2", "2.2.0") < 0)
    }

    @Test
    fun gaBeatsSameCorePreRelease() {
        // 核心版本相等：GA (无 pre 标识) > 任何 pre-release
        assertTrue(checker.compareVersions("2.1.0-beta.2", "2.1.0") < 0)
        assertTrue(checker.compareVersions("2.1.0", "2.1.0-beta.9") > 0)
        assertTrue(checker.compareVersions("2.1.0", "2.1.0") == 0)
    }

    @Test
    fun vPrefixAndCaseInsensitive() {
        assertTrue(checker.compareVersions("v2.1.0-BETA.1", "2.1.0-beta.2") < 0)
        assertTrue(checker.compareVersions("V2.1.0-BETA.2", "v2.1.0-beta.2") == 0)
    }

    @Test
    fun malformedSegmentsFallBackToZero() {
        // 畸形输入按 0 段处理，不抛异常
        assertTrue(checker.compareVersions("", "2.1.0-beta.2") < 0)
        assertTrue(checker.compareVersions("x.y.z", "x.y.z") == 0)
        assertTrue(checker.compareVersions("2.1.0-beta.2", "") > 0)
    }

    // ---------- parseReleaseJson：Releases JSON 解析 ----------

    @Test
    fun parsesFixtureAndDetectsNewerVersion() {
        val info = checker.parseReleaseJson(releaseFixture, "2.1.0-beta.1")
        assertTrue(info != null)
        info!!
        assertEquals("2.1.0-beta.2", info.latestVersion)
        assertEquals(
            "https://github.com/Tri250/-/releases/download/v2.1.0-beta.2/Android-Battery-Master-v2.1.0-beta.2-release.apk",
            info.apkUrl
        )
        assertTrue(info.isPrerelease)
        assertTrue(info.isNewer)
        assertTrue(info.releaseNotes!!.contains("安装说明"))
    }

    @Test
    fun sameVersionReportsNotNewer() {
        val info = checker.parseReleaseJson(releaseFixture, "2.1.0-beta.2")
        assertTrue(info != null && !info!!.isNewer)
    }

    @Test
    fun missingApkAssetYieldsNullUrl() {
        val noApk = releaseFixture.replace(
            Regex("\\{\"name\": \"Android-Battery-Master[^\"]*\"[^}]*},\\s*"),
            ""
        )
        val info = checker.parseReleaseJson(noApk, "2.1.0-beta.1")
        assertTrue(info != null)
        assertNull(info!!.apkUrl)
    }

    @Test
    fun malformedJsonReturnsNullWithoutCrash() {
        assertNull(checker.parseReleaseJson("", "2.1.0-beta.2"))
        assertNull(checker.parseReleaseJson("   ", "2.1.0-beta.2"))
        assertNull(checker.parseReleaseJson("{\"broken\": true", "2.1.0-beta.2"))
        assertNull(checker.parseReleaseJson("<html>rate limit</html>", "2.1.0-beta.2"))
        // 无 tag_name 视为无效
        assertNull(checker.parseReleaseJson("{\"assets\": []}", "2.1.0-beta.2"))
    }

    // ---------- checkForUpdate：fetcher 注入 + 快照落盘 ----------

    @Test
    fun checkForUpdateUsesInjectedFetcherAndPersistsSnapshot() {
        var requestedUrl = ""
        checker.fetcher = { url ->
            requestedUrl = url
            releaseFixture
        }
        val info = checker.checkForUpdate()
        assertTrue(info != null && info!!.latestVersion == "2.1.0-beta.2")
        assertEquals(AppUpdateChecker.RELEASES_LATEST_URL, requestedUrl)

        // isNewer 正向用例：tag 高于当前 BuildConfig.VERSION_NAME (2.1.0-beta.2)
        val newerFixture = releaseFixture.replace(
            "\"tag_name\": \"v2.1.0-beta.2\"", "\"tag_name\": \"v2.1.0-beta.3\""
        )
        checker.fetcher = { newerFixture }
        val newer = checker.checkForUpdate()
        assertTrue(newer != null && newer!!.isNewer && newer.latestVersion == "2.1.0-beta.3")

        val prefs = ApplicationProvider.getApplicationContext<Context>()
            .getSharedPreferences("app_update_prefs", Context.MODE_PRIVATE)
        assertEquals("2.1.0-beta.3", prefs.getString("update_last_latest", null))
        assertTrue(prefs.getLong("update_last_check_at", 0L) > 0)
    }

    @Test
    fun checkForUpdateSwallowsFetcherFailure() {
        checker.fetcher = { throw java.io.IOException("network down") }
        assertNull(checker.checkForUpdate())
    }
}
