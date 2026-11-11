package com.battery.master

import com.battery.master.service.HardwareInfoResolver
import com.battery.master.service.SoCHardwareProfile
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.shadows.ShadowBuild

/**
 * SoC 主控功能模块回归测试 (Robolectric，无模拟器)：
 * 覆盖型号/厂商/制程/CPU/GPU 五字段全量检测链与纯解析函数，
 * 任何环境下输出均非空且带来源标注，杜绝"系统未上报"。
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
class SocHardwareProfileTest {

    /** 每个用例前重置 SoC 探测缓存与 Build 字段，隔离注入状态 */
    @Before
    fun resetSocProbeCache() {
        ShadowBuild.reset()
        SoCHardwareProfile.resetProbeCache()
    }

    // ===== 1. 降级环境：系统 SoC 字段全部缺失时仍返回带来源标注的完整档案 =====

    @Test
    fun socProfile_degradedEnvironment_returnsBadgedProfile() {
        // Robolectric 默认 SOC_MODEL 为空/占位、soc0 与 cpuinfo 不可用 → 工程估算兜底
        val soc = SoCHardwareProfile.resolveSoc()
        assertTrue(soc.model.isNotBlank())
        assertTrue(soc.vendor.isNotBlank())
        assertTrue(soc.process.isNotBlank())
        assertTrue(soc.cpu.isNotBlank())
        assertTrue(soc.gpu.isNotBlank())
        // 五字段均带来源标注，无空洞的"系统未上报"
        listOf(soc.model, soc.vendor, soc.process, soc.cpu, soc.gpu).forEach { field ->
            assertTrue("字段缺少来源标注: $field", field.contains("["))
        }
    }

    // ===== 2. API 31+ Build.SOC_MODEL 实测：高通旗舰映射完整平台档案 =====

    @Test
    fun socProfile_qualcommFlagship_mapsFullPlatformProfile() {
        ShadowBuild.setSystemOnChipModel("SM8650")
        ShadowBuild.setSystemOnChipManufacturer("Qualcomm")
        val soc = SoCHardwareProfile.resolveSoc()
        assertTrue(soc.model.contains("Snapdragon 8 Gen 3"))
        assertTrue(soc.model.contains("[实测]"))
        assertTrue(soc.vendor.contains("Qualcomm 高通"))
        assertTrue(soc.vendor.contains("[实测]"))
        assertTrue(soc.process.contains("4nm"))
        assertTrue(soc.cpu.contains("Cortex-X4"))
        assertTrue(soc.gpu.contains("Adreno 750"))
    }

    // ===== 3. API 31+ Build.SOC_MODEL 实测：联发科天玑 9500 =====

    @Test
    fun socProfile_mediatekFlagship_mapsFullPlatformProfile() {
        ShadowBuild.setSystemOnChipModel("MT6991")
        ShadowBuild.setSystemOnChipManufacturer("MediaTek")
        val soc = SoCHardwareProfile.resolveSoc()
        assertTrue(soc.model.contains("Dimensity 9500"))
        assertTrue(soc.vendor.contains("MediaTek 联发科"))
        assertTrue(soc.process.contains("3nm"))
        assertTrue(soc.cpu.contains("C1-Ultra"))
        assertTrue(soc.gpu.contains("Mali-G1 Ultra MC12"))
    }

    // ===== 4. 平台代号命中：Build.BOARD 为 pineapple 时识别骁龙 8 Gen 3 =====

    @Test
    fun socProfile_boardCodeName_mapsPlatformProfile() {
        // SOC_MODEL 不可用，回退平台代号检测 (Build.BOARD)
        ShadowBuild.setBoard("pineapple")
        val soc = SoCHardwareProfile.resolveSoc()
        assertTrue(soc.model.contains("Snapdragon 8 Gen 3"))
        assertTrue(soc.model.contains("[品牌档案]"))
    }

    // ===== 5. 不可识别型号：保留实测 token，制程/CPU/GPU 诚实估算 =====

    @Test
    fun socProfile_unknownModel_keepsMeasuredTokenAndEstimates() {
        ShadowBuild.setSystemOnChipModel("SM1234")
        val soc = SoCHardwareProfile.resolveSoc()
        assertTrue(soc.model.contains("SM1234"))
        assertTrue(soc.model.contains("[实测]"))
        // 厂商由 token 前缀推断 (SM* -> 高通)
        assertTrue(soc.vendor.contains("Qualcomm 高通"))
        assertTrue(soc.process.contains("[工程估算]"))
        assertTrue(soc.cpu.contains("[工程估算]"))
        assertTrue(soc.gpu.contains("[工程估算]"))
    }

    // ===== 6. 纯函数：cpuinfo Hardware 行解析 =====

    @Test
    fun parseCpuinfoHardwareLine_extractsQualcommToken() {
        val cpuinfo = """
            processor	: 0
            model name	: ARMv8 Processor rev 1 (v8l)
            Hardware	: Qualcomm Technologies, Inc. SM8650
            Features	: fp asimd evtstrm aes pmull sha1 sha2 crc32
        """.trimIndent()
        assertEquals("Qualcomm Technologies, Inc. SM8650", SoCHardwareProfile.parseCpuinfoHardwareLine(cpuinfo))
    }

    @Test
    fun parseCpuinfoHardwareLine_returnsNullWhenAbsent() {
        val cpuinfo = "processor\t: 0\nmodel name\t: x86_64\n"
        assertNull(SoCHardwareProfile.parseCpuinfoHardwareLine(cpuinfo))
    }

    // ===== 7. 纯函数：SoC token 提取与厂商推断 =====

    @Test
    fun extractSocToken_parsesVendorStrings() {
        assertEquals("sm8650", SoCHardwareProfile.extractSocToken("Qualcomm Technologies, Inc. SM8650"))
        assertEquals("mt6989", SoCHardwareProfile.extractSocToken("MT6989"))
        assertEquals("exynos2400", SoCHardwareProfile.extractSocToken("Samsung exynos2400"))
        assertEquals("pineapple", SoCHardwareProfile.extractSocToken("pineapple"))
        assertEquals("tensor", SoCHardwareProfile.extractSocToken("Google Tensor G4"))
    }

    @Test
    fun inferVendorFromModel_infersFromToken() {
        assertEquals("Qualcomm 高通", SoCHardwareProfile.inferVendorFromModel("SM8650"))
        assertEquals("Qualcomm 高通", SoCHardwareProfile.inferVendorFromModel("Snapdragon 8 Gen 3"))
        assertEquals("MediaTek 联发科", SoCHardwareProfile.inferVendorFromModel("MT6991"))
        assertEquals("MediaTek 联发科", SoCHardwareProfile.inferVendorFromModel("天玑 9500"))
        assertEquals("Google 谷歌", SoCHardwareProfile.inferVendorFromModel("Tensor G4"))
        assertEquals("Samsung 三星", SoCHardwareProfile.inferVendorFromModel("Exynos 2400"))
        assertNull(SoCHardwareProfile.inferVendorFromModel("mysterychip"))
    }

    // ===== 8. 纯函数：厂商名归一化与占位值过滤 =====

    @Test
    fun normalizeSocManufacturer_normalizesVendors() {
        assertEquals("Qualcomm 高通", SoCHardwareProfile.normalizeSocManufacturer("QTI"))
        assertEquals("Qualcomm 高通", SoCHardwareProfile.normalizeSocManufacturer("Qualcomm"))
        assertEquals("MediaTek 联发科", SoCHardwareProfile.normalizeSocManufacturer("Mediatek"))
        assertEquals("Samsung 三星", SoCHardwareProfile.normalizeSocManufacturer("Samsung"))
        assertEquals("HiSilicon 海思", SoCHardwareProfile.normalizeSocManufacturer("HiSilicon"))
        assertNull(SoCHardwareProfile.normalizeSocManufacturer("unknown"))
        assertNull(SoCHardwareProfile.normalizeSocManufacturer(""))
        assertNull(SoCHardwareProfile.normalizeSocManufacturer(null))
    }

    // ===== 9. 解析器出口：HardwareTelemetry 五字段全部就绪 =====

    @Test
    fun hardwareResolver_telemetryExposesSocFields() {
        ShadowBuild.setSystemOnChipModel("SM8850")
        ShadowBuild.setSystemOnChipManufacturer("Qualcomm")
        SoCHardwareProfile.resetProbeCache()
        val telemetry = HardwareInfoResolver.resolve(30f, 100, 20f)
        assertTrue(telemetry.socModel.contains("Snapdragon 8 Elite Gen 5"))
        assertTrue(telemetry.socVendor.contains("Qualcomm"))
        assertTrue(telemetry.socProcess.contains("3nm"))
        assertTrue(telemetry.socCpu.contains("Oryon"))
        assertTrue(telemetry.socGpu.contains("Adreno 840"))
    }
}
