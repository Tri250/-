import java.util.Properties

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.compose)
}

// 签名信息放在根目录 keystore.properties（已在 .gitignore 里），缺失时退回仓库内固定 debug 签名，
// 保证没有密钥的环境（比如别人 clone 下来）也能 assembleRelease 出个能装的包。
val keystorePropsFile = rootProject.file("keystore.properties")
val keystoreProps = Properties().apply {
    if (keystorePropsFile.exists()) keystorePropsFile.inputStream().use { load(it) }
}
val hasReleaseKey = keystorePropsFile.exists()

android {
    namespace = "com.smalljelly.batterydata"
    compileSdk {
        version = release(37)
    }

    defaultConfig {
        applicationId = "com.smalljelly.batterydata"
        minSdk = 26
        targetSdk = 37
        versionCode = 112
        versionName = "1.0.12"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    signingConfigs {
        // 仓库内固定 debug 密钥（标准 Android debug 参数）：CI 的 runner 每次都是全新环境，
        // AGP 自动生成的 debug keystore 每次随机——不固定的话每个版本签名都不同，
        // 应用内更新下载的新包必然和已装版本「签名冲突」装不上
        create("pinnedDebug") {
            storeFile = rootProject.file("keystore/fixed-debug.keystore")
            storePassword = "android"
            keyAlias = "androiddebugkey"
            keyPassword = "android"
        }
        if (hasReleaseKey) {
            create("release") {
                storeFile = rootProject.file(keystoreProps.getProperty("storeFile"))
                storePassword = keystoreProps.getProperty("storePassword")
                keyAlias = keystoreProps.getProperty("keyAlias")
                keyPassword = keystoreProps.getProperty("keyPassword")
            }
        }
    }

    buildTypes {
        release {
            signingConfig = if (hasReleaseKey) {
                signingConfigs.getByName("release")
            } else {
                signingConfigs.getByName("pinnedDebug")
            }
            optimization {
                enable = true
                packageScope = setOf("androidx.**", "kotlin.**", "kotlinx.**")
            }
        }
        debug {
            // 本机开发构建也固定到同一密钥：与 CI 产物签名一致，可互相覆盖安装
            signingConfig = signingConfigs.getByName("pinnedDebug")
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }
    buildFeatures {
        compose = true
        // Shizuku 特权服务（超级岛 XMSF 网络 bypass）需要 AIDL 接口
        aidl = true
    }
}

dependencies {
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.activity.compose)
    implementation(libs.androidx.compose.material3)
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.ui.graphics)
    implementation(libs.androidx.compose.ui.tooling.preview)
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.core)
    implementation(libs.nexioui)
    implementation(libs.softglass)
    implementation(libs.shizuku.api)
    implementation(libs.shizuku.provider)
    implementation(libs.miuix.ui)
    implementation(libs.miuix.icons)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    testImplementation(libs.junit)
    androidTestImplementation(platform(libs.androidx.compose.bom))
    androidTestImplementation(libs.androidx.compose.ui.test.junit4)
    androidTestImplementation(libs.androidx.espresso.core)
    androidTestImplementation(libs.androidx.junit)
    debugImplementation(libs.androidx.compose.ui.test.manifest)
    debugImplementation(libs.androidx.compose.ui.tooling)
}