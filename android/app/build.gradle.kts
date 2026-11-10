plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
}

// 签名参数由 CI 通过环境变量注入（GitHub Secrets），本地构建同样可注入；
// 缺失时回退 debug 签名，保证流水线与本地开发始终可产出可安装 APK
val releaseKeystoreFile = System.getenv("KEYSTORE_FILE")
val releaseKeystorePass = System.getenv("KEYSTORE_PASSWORD")
val releaseKeyPass = System.getenv("KEY_PASSWORD")
val hasReleaseSigning = releaseKeystoreFile != null &&
    releaseKeystorePass != null && releaseKeyPass != null

android {
    namespace = "com.battery.master"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.battery.master"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    signingConfigs {
        if (hasReleaseSigning) {
            create("release") {
                storeFile = file(releaseKeystoreFile as String)
                storePassword = releaseKeystorePass
                keyAlias = "battery-master"
                keyPassword = releaseKeyPass
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
}
