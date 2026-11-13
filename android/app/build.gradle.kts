plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
}

// 签名参数由 CI 通过环境变量注入（GitHub Secrets），本地构建同样可注入；
// 缺失时回退 debug 签名，保证流水线与本地开发始终可产出可安装 APK
val releaseKeystoreFile = System.getenv("KEYSTORE_FILE")
val releaseKeystorePass = System.getenv("KEYSTORE_PASSWORD")
// v1.2.6 P2 审计修复：KEY_ALIAS 由 CI Secret 注入 (旧实现硬编码 "battery-master"，
// Secret 实际注入了别名却被无视，更换 keystore/别名必须改源码)；缺失时回退历史别名
val releaseKeyAlias = System.getenv("KEY_ALIAS")
val releaseKeyPass = System.getenv("KEY_PASSWORD")
val hasReleaseSigning = releaseKeystoreFile != null &&
    releaseKeystorePass != null && releaseKeyPass != null

android {
    namespace = "com.battery.master"
    // v2.0.0-alpha 批次G：compileSdk/targetSdk 升至 36 (Android 16)
    compileSdk = 36

    defaultConfig {
        applicationId = "com.battery.master"
        minSdk = 26
        targetSdk = 36
        versionCode = 12
        versionName = "2.0.0-alpha"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    signingConfigs {
        if (hasReleaseSigning) {
            create("release") {
                storeFile = file(releaseKeystoreFile as String)
                storePassword = releaseKeystorePass
                keyAlias = releaseKeyAlias ?: "battery-master"
                keyPassword = releaseKeyPass
                // v1.2.6 P3 审计修复：显式启用签名方案 (v1/v2/v3)——v3 轮换证明在
                // targetSdk 30+ 设备必需；旧实现依赖 AGP 默认行为，不同配置下可能缺 v3。
                // v2.0.0-alpha 批次G：升级 AGP 8.10.1 后经 javap 实证 DSL 仅提供
                // enableV1/V2/V3/V4Signing——v3.1 (轮换密钥证明) 无 DSL 开关，且该方案
                // 仅对已实际执行密钥轮换的密钥库有意义，当前单层密钥库由 v3 覆盖；
                // 同步显式启用 v4 (增量安装/文件级校验，不影响 v2/v3 兼容性)
                enableV1Signing = true
                enableV2Signing = true
                enableV3Signing = true
                enableV4Signing = true
            }
        }
    }

    buildTypes {
        release {
            // 正式发布：R8 全量混淆 + 资源收缩，压缩包体并移除未引用代码/资源
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            signingConfig = if (hasReleaseSigning) {
                signingConfigs.getByName("release")
            } else {
                signingConfigs.getByName("debug")
            }
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        compose = true
        // AboutAppCard 版本徽章经 BuildConfig.VERSION_NAME/VERSION_CODE 单源注入
        buildConfig = true
    }
    testOptions {
        unitTests {
            // Robolectric 需要资源与 Manifest 上下文
            isIncludeAndroidResources = true
        }
    }
}

dependencies {
    implementation(platform("androidx.compose:compose-bom:2024.10.01"))
    implementation("androidx.activity:activity-compose:1.9.3")
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.7")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.7")
    implementation("androidx.core:core-ktx:1.15.0")

    // 单元测试 (Robolectric)：无模拟器验证启动全链路 (Activity/ViewModel/Receiver/Resolver)
    testImplementation("junit:junit:4.13.2")
    testImplementation("org.robolectric:robolectric:4.14.1")
    testImplementation("androidx.test:core-ktx:1.6.1")
    testImplementation(platform("androidx.compose:compose-bom:2024.10.01"))
    testImplementation("androidx.compose.ui:ui-test-junit4")
    debugImplementation("androidx.compose.ui:ui-test-manifest")
}
