package com.smalljelly.batterydata

import android.graphics.Color
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.ui.graphics.Color as ComposeColor
import com.smalljelly.batterydata.data.ChargeRecorder
import com.smalljelly.batterydata.ui.BatteryScreen
import com.smalljelly.batterydata.ui.theme.AppMaterial
import com.smalljelly.batterydata.ui.theme.BatteryTheme
import com.haooz.nexioui.scaffold.Scaffold
import com.haooz.softglass.SoftGlassTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // 状态栏与导航栏全透明，配合 Scaffold 的零 Insets 实现沉浸式
        enableEdgeToEdge(
            statusBarStyle = SystemBarStyle.auto(Color.TRANSPARENT, Color.TRANSPARENT),
            navigationBarStyle = SystemBarStyle.auto(Color.TRANSPARENT, Color.TRANSPARENT),
        )
        // 恢复上次没记完的充电过程（进程被杀 / 手机重启后也能接着记）
        ChargeRecorder.ensure(this)
        // Shizuku / 超级岛：绑定高权限服务（超级岛通知 bypass XMSF 网络用）
        com.smalljelly.batterydata.island.BatteryIslandHelper.init(this)
        setContent {
            BatteryTheme {
                // 玻璃材质提到最外层：下面那层 Scaffold 的弹层宿主（下拉 / 对话框）也在里面。
                // 弹层面板要采样页面内容做模糊，材质必须在这一层就能读到 ——
                // 之前主题只套在页面内部，弹层画在宿主里等于"没有材质"，
                // 面板只剩一块底色（用户看到的灰块），玻璃糊层根本没生效。
                SoftGlassTheme(
                    level = AppMaterial.current.glassLevel,
                    isDark = isSystemInDarkTheme(),
                    hasWallpaper = false,
                ) {
                    // 最外层 Scaffold 只干一件事：给 NexioUI 的窗口级浮层提供弹层宿主。
                    // 库把宿主放在 Scaffold 里，而首页这类没有自己 Scaffold 的页面拿不到宿主
                    // —— OverlayDropdownPopup 会直接不渲染（点了没反应）。
                    // 底色透明 + 零 Insets：排版和原来一比一，不影响沉浸式。
                    Scaffold(
                        containerColor = ComposeColor.Transparent,
                        contentWindowInsets = WindowInsets(0, 0, 0, 0),
                    ) { _ ->
                        BatteryScreen()
                    }
                }
            }
        }
    }

    override fun onDestroy() {
        // 岛 / 流体云 / 兜底通知都由前台采样驱动：App 退出（非旋转重建）后就没人再收了。
        // 不在记录中（没有前台服务兜着）时主动收掉，避免充电中退出 App 后通知一直挂在
        // 通知栏；记录中由前台服务继续采样，拔电自会收。
        if (isFinishing &&
            ChargeRecorder.state.value is com.smalljelly.batterydata.data.RecorderState.Idle
        ) {
            com.smalljelly.batterydata.island.BatteryIslandHelper.cancel(this)
        }
        super.onDestroy()
    }
}