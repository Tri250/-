package com.battery.master

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import com.battery.master.ui.BatteryScreen
import com.battery.master.ui.theme.MintTheme
import com.battery.master.ui.theme.MintThemeMode
import com.battery.master.ui.theme.MintThemeStore
import com.battery.master.viewmodel.BatteryViewModel

class MainActivity : ComponentActivity() {

    private val batteryViewModel: BatteryViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // 「薄荷能量」v2.2.0：浅色默认 + 深色夜航森林可选。
        // 系统栏图标明暗由 MintTheme 按当前主题模式 SideEffect 动态切换，
        // 这里以透明样式铺底 (边缘到edge布局)，图标对比度不再恒定假设暗底
        enableEdgeToEdge(
            statusBarStyle = SystemBarStyle.auto(
                android.graphics.Color.TRANSPARENT,
                android.graphics.Color.TRANSPARENT
            ),
            navigationBarStyle = SystemBarStyle.auto(
                android.graphics.Color.TRANSPARENT,
                android.graphics.Color.TRANSPARENT
            )
        )

        setContent {
            // 主题模式持久化加载 (SharedPreferences "mint_theme_prefs")，
            // 之后由「我的」页改写 MintThemeHolder (唯一事实来源)
            MintTheme(mode = MintThemeStore.load(this)) {
                BatteryScreen(viewModel = batteryViewModel)
            }
        }
    }

    // v1.2.4 P3 审计修复：1Hz 轮询生命周期门控——退后台/锁屏暂停 sysfs 轮询
    // (电池监测工具持续后台轮询属反向耗电缺陷)，回前台恢复；广播通道不受影响
    override fun onResume() {
        super.onResume()
        batteryViewModel.setTelemetryPollingActive(true)
    }

    override fun onPause() {
        super.onPause()
        batteryViewModel.setTelemetryPollingActive(false)
    }
}
